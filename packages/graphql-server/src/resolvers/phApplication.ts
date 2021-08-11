import { Context } from './interface';
import {
  toRelay, filter, paginate, extractPagination, isGroupMember
} from './utils';
import {
  PhApplicationSpec, PhApplicationStatus, PhApplicationScope, PhApplicationPhase, InstanceTypeSpec, client as kubeClient
} from '../crdClient/crdClientImpl';
import { transform as templateTransform, PhAppTemplate } from './phAppTemplate';
import { mapping } from './instanceType';
import CustomResource, { Item } from '../crdClient/customResource';
import { get, find, isEmpty } from 'lodash';
import { ApolloError } from 'apollo-server';
import KeycloakAdminClient from 'keycloak-admin';
import {createConfig} from '../config';

const config = createConfig();

const ANNOTATIONS_TEMPLATE_NAME = 'phapplication.primehub.io/template';
const ANNOTATIONS_TEMPLATE_DATA_NAME = 'phapplication.primehub.io/template-data';
const ANNOTATIONS_INSTANCE_TYPE_NAME = 'phapplication.primehub.io/instance-type';

const APP_TEMPLATE_NOT_FOUND = 'APP_TEMPLATE_NOT_FOUND';
const APP_TEMPLATE_DATA_NOT_FOUND = 'APP_TEMPLATE_DATA_NOT_FOUND';
const APP_INSTANCE_TYPE_NOT_FOUND = 'APP_INSTANCE_TYPE_NOT_FOUND';
const NOT_AUTH_ERROR = 'NOT_AUTH';

interface EnvVar {
  name: string;
  value: string;
}

interface DefaultEnvVar {
  name: string;
  description: string;
  defaultValue: string;
  optional: boolean;
}

export interface PhApplication {
  id: string;
  displayName: string;
  appName: string;
  appVersion: string;
  appIcon: string;
  appDefaultEnv: DefaultEnvVar[];
  appTemplate: PhAppTemplate;
  groupName: string;
  instanceType: string;
  instanceTypeSpec: InstanceTypeSpec;
  scope: PhApplicationScope;
  appUrl: string;
  internalAppUrl: string;
  svcEndpoints: string[];
  stop: boolean;
  env: EnvVar[];
  status: PhApplicationPhase;
  message: string;
  rewrite?: boolean;
}

export interface PhApplicationMutationInput {
  templateId: string;
  id: string;
  displayName: string;
  groupName: string;
  env: EnvVar[];
  instanceType: string;
  scope: PhApplicationScope;
}

const labelStringify = (labels: Record<string, string>) => {
  return Object.keys(labels).map(labelKey => {
    const labelValue = labels[labelKey];
    return `${labelKey}=${labelValue}`;
  }).join(',');
};

export const typeResolvers = {
  async instanceTypeSpec(parent, args, context: Context) {
    if (!parent.instanceTypeSpec) {
      return null;
    }
    return mapping(parent.instanceTypeSpec);
  },
  async pods(parent, args, context: Context) {
    const labelSelector = labelStringify({
      'app': 'primehub-app',
      'primehub.io/phapplication': `app-${parent.id}`,
    });
    const {body: {items}} = await kubeClient.api.v1.namespaces(context.crdNamespace).pods.get({
      qs: {labelSelector}
    });
    return (items || []).map(item => {
      const podName = get(item, 'metadata.name');
      return {
        name: podName,
        logEndpoint:
          `${context.graphqlHost}${context.podLogs.getPhApplicationPodEndpoint(podName)}`,
      };
    });
  },
};

export const transform = async (item: Item<PhApplicationSpec, PhApplicationStatus>, kcAdminClient: KeycloakAdminClient): Promise<PhApplication> => {
  const podSpec = item.spec && item.spec.podTemplate && item.spec.podTemplate.spec;
  const svcSpec = item.spec && item.spec.svcTemplate && item.spec.svcTemplate.spec;
  // TODO: check if podSpec and svcSpec exists

  const appTemplate = getAppTemplateFromAnnotations(item);
  const appName = appTemplate.metadata.name;
  const appVersion = appTemplate.spec.version;
  const appIcon = appTemplate.spec.icon;
  const appDefaultEnv = appTemplate.spec.defaultEnvs;
  const userPostedData = getAppTemplateDataFromAnnotations(item);
  const instanceTypeSpec = getInstanceTypeFromAnnotations(item);

  let svcEndpoints = [];
  let internalAppUrl = null;
  let env = [];

  const svcName = item.status && item.status.serviceName;
  if (svcName && svcSpec.ports && svcSpec.ports.length > 0) {
    svcEndpoints = svcSpec.ports.map(p => `${svcName}:${p.port}`);
  }

  if (svcName && item.spec.httpPort) {
    internalAppUrl = `http://${svcName}:${item.spec.httpPort}/console/apps/${item.metadata.name}`;
  }

  if (userPostedData.env && userPostedData.env.length > 0) {
    env = userPostedData.env;
  }

  return {
    id: item.metadata.name,
    displayName: item.spec.displayName,
    appName,
    appVersion,
    appIcon,
    appDefaultEnv,
    appTemplate: await templateTransform(appTemplate),
    groupName: item.spec.groupName,
    instanceType: item.spec.instanceType,
    instanceTypeSpec,
    scope: item.spec.scope,
    appUrl: `${config.graphqlHost}/console/apps/${item.metadata.name}`,
    internalAppUrl,
    svcEndpoints,
    stop: item.spec.stop,
    env,
    status: item.status ? item.status.phase : PhApplicationPhase.Error,
    message: item.status ? item.status.message : null,
    rewrite: item.spec.rewrite ? item.spec.rewrite : false,
  };
};

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<PhApplicationSpec, PhApplicationStatus>, where: any, order: any, context: Context): Promise<PhApplication[]> => {
  const {namespace, graphqlHost, userId: currentUserId, kcAdminClient} = context;
  if (where && where.id) {
    const phApplication = await client.get(where.id);
    const transformed = await transform(phApplication, kcAdminClient);
    const viewable = await isGroupMember(currentUserId, transformed.groupName, kcAdminClient);
    if (!viewable) {
      throw new ApolloError('user not auth', NOT_AUTH_ERROR);
    }
    return [transformed];
  }

  const phApplications = await client.list();
  const transformedPhApplications = await Promise.all(
    phApplications.map(item => transform(item, kcAdminClient)));

  order = isEmpty(order) ? {displayName: 'asc'} : order;
  return filter(transformedPhApplications, where, order);
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phApplications = await listQuery(crdClient.phApplications, args && args.where, args && args.orderBy, context);
  return paginate(phApplications, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phApplications = await listQuery(crdClient.phApplications, args && args.where, args && args.orderBy, context);
  return toRelay(phApplications, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient, userId: currentUserId, kcAdminClient} = context;
  const phApplication = await crdClient.phApplications.get(id);
  const transformed =
    await transform(phApplication, context.kcAdminClient);
  const viewable = await isGroupMember(currentUserId, transformed.groupName, kcAdminClient);
  if (!viewable && currentUserId !== 'jupyterHub') {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
  return transformed;
};

const getAppTemplateFromAnnotations = (item: Item<PhApplicationSpec, PhApplicationStatus>) => {
  const templateString = item.metadata && item.metadata.annotations && item.metadata.annotations[ANNOTATIONS_TEMPLATE_NAME];
  if (templateString) {
    return JSON.parse(templateString.trim());
  }
  throw new ApolloError(`No template in PhApplication '${item.metadata.name}'`, APP_TEMPLATE_NOT_FOUND);
};

const getInstanceTypeFromAnnotations = (item: Item<PhApplicationSpec, PhApplicationStatus>) => {
  const instanceTypeString = item.metadata && item.metadata.annotations && item.metadata.annotations[ANNOTATIONS_INSTANCE_TYPE_NAME];
  if (instanceTypeString) {
    return JSON.parse(instanceTypeString.trim());
  }
  throw new ApolloError(`No instance type in PhApplication '${item.metadata.name}'`, APP_INSTANCE_TYPE_NOT_FOUND);
};

const getAppTemplateDataFromAnnotations = (item: Item<PhApplicationSpec, PhApplicationStatus>) => {
  const dataString = item.metadata && item.metadata.annotations && item.metadata.annotations[ANNOTATIONS_TEMPLATE_DATA_NAME];
  if (dataString) {
    return JSON.parse(dataString.trim());
  }
  throw new ApolloError(`No template data in PhApplication '${item.metadata.name}'`, APP_TEMPLATE_DATA_NOT_FOUND);
};

const patchAppTemplateData = (item: Item<PhApplicationSpec, PhApplicationStatus>, data: Partial<PhApplicationMutationInput>) => {
  const dataString = item.metadata && item.metadata.annotations && item.metadata.annotations[ANNOTATIONS_TEMPLATE_DATA_NAME];
  if (dataString) {
    const templateData = JSON.parse(dataString.trim());
    Object.keys(data).forEach(k => { templateData[k] = data[k]; });
    return JSON.stringify(templateData);
  }
  throw new ApolloError(`No template data in PhApplication '${item.metadata.name}'`, APP_TEMPLATE_DATA_NOT_FOUND);
};

const createApplication = async (context: Context, data: PhApplicationMutationInput) => {
  const {crdClient} = context;

  const appTemplate = await crdClient.phAppTemplates.get(data.templateId);
  const instanceType = await crdClient.instanceTypes.get(data.instanceType);

  const metadata = {
    name: data.id.toLowerCase(),
    annotations: {
      [ANNOTATIONS_TEMPLATE_NAME]: JSON.stringify(appTemplate),
      [ANNOTATIONS_TEMPLATE_DATA_NAME]: JSON.stringify(data),
      [ANNOTATIONS_INSTANCE_TYPE_NAME]: JSON.stringify(instanceType),
    }
  };

  const podTemplate = appTemplate.spec.template.spec && appTemplate.spec.template.spec.podTemplate;
  const svcTemplate = appTemplate.spec.template.spec && appTemplate.spec.template.spec.svcTemplate;
  let httpPort = null;
  let rewrite = false;
  let appRoot = null;

  // Append env to pod template
  if (podTemplate.spec.containers && podTemplate.spec.containers.length > 0) {
    podTemplate.spec.containers[0].env = get(podTemplate.spec.containers[0], 'env', []).concat(get(data, 'env', []));
  }

  if (appTemplate.spec.template.spec && appTemplate.spec.template.spec.httpPort) {
    httpPort = appTemplate.spec.template.spec.httpPort;
  }

  if (appTemplate.spec.template.spec && appTemplate.spec.template.spec.rewrite) {
    rewrite = appTemplate.spec.template.spec.rewrite;
  }

  if (appTemplate.spec.template.spec && appTemplate.spec.template.spec.appRoot) {
    appRoot = appTemplate.spec.template.spec.appRoot;
  }

  const spec = {
    stop: false,
    displayName: data.displayName,
    groupName: data.groupName,
    instanceType: data.instanceType,
    scope: data.scope,
    podTemplate,
    svcTemplate,
    httpPort,
    rewrite,
    appRoot,
  };
  return crdClient.phApplications.create(metadata, spec);
};

export const create = async (root, args, context: Context) => {
  const data: PhApplicationMutationInput = args.data;
  // TODO: validate data.env
  const mutable = await isGroupMember(context.userId, data.groupName, context.kcAdminClient);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
  const phApplication = await createApplication(context, data);
  return transform(phApplication, context.kcAdminClient);
};

export const update = async (root, args, context: Context) => {
  const {crdClient, userId} = context;
  const data: Partial<PhApplicationMutationInput> = args.data;
  // TODO: validate data.env
  const item = await crdClient.phApplications.get(args.where.id);
  const mutable = await isGroupMember(userId, item.spec.groupName, context.kcAdminClient);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
  const appTemplate = getAppTemplateFromAnnotations(item);
  const instanceType = await crdClient.instanceTypes.get(data.instanceType);
  const metadata = item.metadata;

  if (metadata && metadata.annotations) {
    metadata.annotations[ANNOTATIONS_TEMPLATE_DATA_NAME] = patchAppTemplateData(item, data);
    metadata.annotations[ANNOTATIONS_INSTANCE_TYPE_NAME] = JSON.stringify(instanceType);
  }

  const spec = item.spec;
  spec.instanceType = data.instanceType;
  spec.scope = data.scope;
  spec.displayName = data.displayName;

  // Append env to pod template
  if (spec.podTemplate.spec.containers && spec.podTemplate.spec.containers.length > 0) {
    spec.podTemplate.spec.containers[0].env = get(appTemplate.spec.template.spec.podTemplate.spec.containers[0], 'env', []).concat(data.env);
  }

  const updated = await context.crdClient.phApplications.patch(args.where.id, {metadata, spec});
  return transform(updated, context.kcAdminClient);
};

export const destroy = async (root, args, context: Context) => {
  const {crdClient, userId} = context;
  const {id} = args.where;
  const phApplication = await crdClient.phApplications.get(id);
  const mutable = await isGroupMember(userId, phApplication.spec.groupName, context.kcAdminClient);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  await context.crdClient.phApplications.del(id);
  return {id};
};

const toggleApplication = async (isStop: boolean, args, context: Context) => {
  const {crdClient, userId} = context;
  const {id} = args.where;
  const item = await crdClient.phApplications.get(args.where.id);
  const mutable = await isGroupMember(userId, item.spec.groupName, context.kcAdminClient);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  const spec = item.spec;
  spec.stop = isStop;

  const updated = await context.crdClient.phApplications.patch(args.where.id, {spec});
  return transform(updated, context.kcAdminClient);
};

export const start = async (root, args, context: Context) => {
  return toggleApplication(false, args, context);
};

export const stop = async (root, args, context: Context) => {
  return toggleApplication(true, args, context);
};
