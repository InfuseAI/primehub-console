import { Context } from './interface';
import {
  toRelay, filter, paginate, extractPagination, getFromAttr, parseMemory, getGroupIdsByUser, mergeVariables, validateLicense
} from './utils';
import {
  PhDeploymentSpec, PhDeploymentStatus, PhDeploymentPhase, client as kubeClient
} from '../crdClient/crdClientImpl';
import CustomResource, { Item } from '../crdClient/customResource';
import { orderBy, omit, get, isUndefined, isNil, isEmpty, isNull, capitalize } from 'lodash';
import * as moment from 'moment';
import { ApolloError } from 'apollo-server';
import KeycloakAdminClient from 'keycloak-admin';
import { mapping } from './instanceType';
import * as logger from '../logger';
import { keycloakMaxCount } from './constant';
import { isUserAdmin } from './user';
import md5 = require('apache-md5');

const EXCEED_QUOTA_ERROR = 'EXCEED_QUOTA';
const NOT_AUTH_ERROR = 'NOT_AUTH';

export interface PhDeployment {
  id: string;
  status: PhDeploymentPhase;
  message: string;
  name: string;
  description: string;
  metadata: Record<string, any>;
  stop: boolean;
  userId: string;
  userName: string;
  groupId: string;
  groupName: string;
  endpoint: string;
  modelImage: string;
  replicas: number;
  availableReplicas: number;
  imagePullSecret: string;
  instanceType: string;
  creationTime: string;
  lastUpdatedTime: string;
  history: Array<{time: string, deployment: any}>;
  endpointAccessType: string;
  endpointClients: Array<{name: string}>;
}

export interface PhDeploymentMutationInput {
  id: string;
  name: string;
  replicas: number;
  modelImage: string;
  imagePullSecret: string;
  description: string;
  metadata: Record<string, any>;
  groupId: string;
  instanceType: string;
  endpointAccessType: string;
}

const getFallbackPhase = (stopped: boolean, phase: PhDeploymentPhase) => {
  const finalized = [PhDeploymentPhase.Deployed, PhDeploymentPhase.Failed].indexOf(phase) >= 0;
  // if user click start, but operator hasn't change phase to `Deploying` or it hasn't transit to finalized phases
  if (!stopped && !finalized) {
    return PhDeploymentPhase.Deploying;
  }

  // if user click stop, but operator hasn't change phase to `Stopping` or transit to `Stopped`
  if (stopped && phase !== PhDeploymentPhase.Stopped) {
    return PhDeploymentPhase.Stopping;
  }

  return phase || PhDeploymentPhase.Stopped;
};

const transformSpec = (id: string, time: string, groupName: string, spec: any) => {
  const predictator = get(spec, 'predictors.0');
  return {
    id: `${id}-${time}`,
    name: spec.displayName,
    description: spec.description,
    userId: spec.userId,
    userName: spec.userName,
    groupName,
    groupId: spec.groupId,
    stop: isUndefined(spec.stop) ? false : spec.stop,
    lastUpdatedTime: spec.updateTime,

    // predictator
    modelImage: predictator.modelImage,
    replicas: predictator.replicas,
    imagePullSecret: predictator.imagePullSecret,
    instanceType: predictator.instanceType,
    metadata: predictator.metadata,
  };
};

// tslint:disable-next-line:max-line-length
export const transform = async (item: Item<PhDeploymentSpec, PhDeploymentStatus>, kcAdminClient: KeycloakAdminClient): Promise<PhDeployment> => {
  const group = item.spec.groupId ?
    await kcAdminClient.groups.findOne({id: item.spec.groupId}) : null;
  const groupName = get(group, 'attributes.displayName.0') || get(group, 'name') || item.spec.groupName;
  const predictator = item.spec.predictors[0];
  const phase = get(item, 'status.phase');
  const status = getFallbackPhase(item.spec.stop, phase);
  const history = get(item, 'status.history', []).map(historyItem => {
    return {
      time: historyItem.time,
      deployment: transformSpec(item.metadata.name, historyItem.time, groupName, historyItem.spec),
    };
  });
  const endpointAccessType = get(item, 'spec.endpoint.accessType', 'public');
  const endpointClients = get(item, 'spec.endpoint.clients', []).map(clientItem => {
    return {
      name: clientItem.name,
    };
  });

  return {
    id: item.metadata.name,
    name: item.spec.displayName,
    description: item.spec.description,
    userId: item.spec.userId,
    userName: item.spec.userName,
    groupId: item.spec.groupId,
    stop: item.spec.stop,
    groupName,

    // status
    status,
    message: get(item, 'status.message'),
    endpoint: get(item, 'status.endpoint'),
    availableReplicas: get(item, 'status.availableReplicas'),

    // predictator
    modelImage: predictator.modelImage,
    replicas: predictator.replicas,
    imagePullSecret: predictator.imagePullSecret,
    instanceType: predictator.instanceType,
    metadata: predictator.metadata,

    // times
    creationTime: item.metadata.creationTimestamp,
    lastUpdatedTime: item.spec.updateTime,

    // history
    history,

    endpointAccessType,
    endpointClients,
  };
};

const createDeployment = async (context: Context, data: PhDeploymentMutationInput) => {
  const {crdClient, kcAdminClient, userId, username} = context;
  const group = await kcAdminClient.groups.findOne({id: data.groupId});
  const metadata = {
    name: data.id,
  };
  const spec = {
    updateTime: moment.utc().toISOString(),
    displayName: data.name,
    userId,
    userName: username,
    groupId: group.id,
    groupName: group.name,
    stop: false,
    description: data.description,
    predictors: [{
      name: 'predictor1',
      replicas: data.replicas,
      modelImage: data.modelImage,
      instanceType: data.instanceType,
      imagePullSecret: data.imagePullSecret,
      metadata: data.metadata,
    }],
    endpoint: {
      accessType: data.endpointAccessType || 'public',
      clients: []
    },
  };
  return crdClient.phDeployments.create(metadata, spec);
};

const validateQuota = async (context: Context, groupId: string, instanceTypeId: string) => {
  const group = await context.kcAdminClient.groups.findOne({id: groupId});
  const quotaCpu: number = getFromAttr('quota-cpu', group.attributes, null, parseFloat);
  const quotaGpu: number = getFromAttr('quota-gpu', group.attributes, null, parseInt);
  const quotaMemory: number = getFromAttr('quota-memory', group.attributes, null, parseMemory);
  const projectQuotaCpu: number = getFromAttr('project-quota-memory', group.attributes, null, parseFloat);
  const projectQuotaGpu: number = getFromAttr('project-quota-gpu', group.attributes, null, parseInt);
  const projectQuotaMemory: number = getFromAttr('project-quota-memory', group.attributes, null, parseMemory);

  // validate
  const instanceType = await context.getInstanceType(instanceTypeId);
  const instanceTypeCpuLimit = instanceType.spec['limits.cpu'];
  const instanceTypeGpuLimit = instanceType.spec['limits.nvidia.com/gpu'];
  const instanceTypeMemoryLimit =
    instanceType.spec['limits.memory'] ? parseMemory(instanceType.spec['limits.memory']) : null;

  // check if gpu quota exceed
  if (!isNil(instanceTypeGpuLimit)) {
    if (!isNil(quotaGpu) && instanceTypeGpuLimit > quotaGpu) {
      throw new ApolloError('User Gpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }

    if (!isNil(projectQuotaGpu) && instanceTypeGpuLimit > projectQuotaGpu) {
      throw new ApolloError('Group Gpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }
  }

  // check if cpu quota exceed
  if (!isNil(instanceTypeCpuLimit)) {
    if (!isNil(quotaCpu) && instanceTypeCpuLimit > quotaCpu) {
      throw new ApolloError('User Cpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }

    if (!isNil(projectQuotaCpu) && instanceTypeCpuLimit > projectQuotaCpu) {
      throw new ApolloError('Group Cpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }
  }

  // check if memory quota exceed
  if (!isNil(instanceTypeMemoryLimit)) {
    if (!isNil(quotaMemory) && instanceTypeMemoryLimit > quotaMemory) {
      throw new ApolloError('User Memory exceeded', EXCEED_QUOTA_ERROR);
    }

    if (!isNil(projectQuotaMemory) && instanceTypeMemoryLimit > projectQuotaMemory) {
      throw new ApolloError('Group Memory exceeded', EXCEED_QUOTA_ERROR);
    }
  }
};

/**
 * Query
 */

const labelStringify = (labels: Record<string, string>) => {
  return Object.keys(labels).map(labelKey => {
    const labelValue = labels[labelKey];
    return `${labelKey}=${labelValue}`;
  }).join(',');
};

export const typeResolvers = {
  async instanceType(parent, args, context: Context) {
    const instanceTypeId = parent.instanceType;
    if (!instanceTypeId) {
      return null;
    }

    try {
      const instanceType = await context.getInstanceType(instanceTypeId);
      return mapping(instanceType);
    } catch (error) {
      logger.info({
        component: logger.components.phDeployment,
        type: 'RESOURCE_NOT_FOUND',
        id: parent.id,
        instanceTypeId
      });
      return {
        id: `${instanceTypeId}-not-found`,
        name: instanceTypeId,
        tolerations: []
      };
    }
  },
  async pods(parent, args, context: Context) {
    const labelSelector = labelStringify({
      'app': 'primehub-deployment',
      'primehub.io/phdeployment': parent.id,
    });
    const {body: {items}} = await kubeClient.api.v1.namespaces(context.crdNamespace).pods.get({
      qs: {labelSelector}
    });
    return (items || []).map(item => {
      const podName = get(item, 'metadata.name');
      const phase = get(item, 'status.phase');
      return {
        name: podName,
        phase,
        logEndpoint:
          `${context.graphqlHost}${context.jobLogCtrl.getPhDeploymentEndpoint(context.crdNamespace, podName)}`,
      };
    });
  },
};

const canUserView = async (userId: string, phDeployment: PhDeployment, context: Context): Promise<boolean> => {
  const isAdmin = await isUserAdmin(context.realm, userId, context.kcAdminClient);
  if (isAdmin) { return true; }

  const members = await context.kcAdminClient.groups.listMembers({
    id: phDeployment.groupId,
    max: keycloakMaxCount
  });
  const memberIds = members.map(user => user.id);
  if (memberIds.indexOf(userId) >= 0) { return true; }
  return false;
};

const canUserMutate = async (userId: string, groupId: string, context: Context) => {
  const members = await context.kcAdminClient.groups.listMembers({
    id: groupId,
    max: keycloakMaxCount
  });
  const memberIds = members.map(user => user.id);
  return (memberIds.indexOf(userId) >= 0);
};

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<PhDeploymentSpec>, where: any, context: Context): Promise<PhDeployment[]> => {
  const {namespace, graphqlHost, userId: currentUserId, kcAdminClient} = context;
  if (where && where.id) {
    const phDeployment = await client.get(where.id);
    const transformed = await transform(phDeployment, kcAdminClient);
    const viewable = await canUserView(currentUserId, transformed, context);
    if (!viewable) {
      throw new ApolloError('user not auth', NOT_AUTH_ERROR);
    }
    return [transformed];
  }

  const phDeployments = await client.list();
  let transformedPhDeployments = await Promise.all(
    phDeployments.map(schedule => transform(schedule, kcAdminClient)));

  // if (where && where.mine) {
  //   where.userId_eq = currentUserId;
  // }

  // if (isEmpty(where.groupId_in)) {
  //   where.groupId_in = await getGroupIdsByUser(context, currentUserId);
  // }

  // sort by updateTime
  transformedPhDeployments = orderBy(transformedPhDeployments, 'lastUpdatedTime', 'desc');
  return filter(transformedPhDeployments, omit(where, 'mine'));
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phDeployments = await listQuery(crdClient.phDeployments, args && args.where, context);
  return paginate(phDeployments, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phDeployments = await listQuery(crdClient.phDeployments, args && args.where, context);
  return toRelay(phDeployments, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient, userId: currentUserId} = context;
  const phDeployment = await crdClient.phDeployments.get(id);
  const transformed =
    await transform(phDeployment, context.kcAdminClient);
  const viewable = await canUserView(currentUserId, transformed, context);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
  return transformed;
};

export const create = async (root, args, context: Context) => {
  const data: PhDeploymentMutationInput = args.data;
  validateLicense();
  await validateQuota(context, data.groupId, data.instanceType);
  await canUserMutate(context.userId, data.groupId, context);
  const phDeployment = await createDeployment(context, data);
  return transform(phDeployment, context.kcAdminClient);
};

export const update = async (root, args, context: Context) => {
  const {crdClient, userId, username} = context;
  const data: Partial<PhDeploymentMutationInput> = args.data;
  const phDeployment = await crdClient.phDeployments.get(args.where.id);
  // group is immutable
  const groupId = phDeployment.spec.groupId;
  const instanceType = data.instanceType || phDeployment.spec.predictors[0].instanceType;
  await validateQuota(context, groupId, instanceType);
  await canUserMutate(userId, groupId, context);

  // metadata
  const predictor = phDeployment.spec.predictors[0];
  const originalMetadata = predictor.metadata || {};
  const newMetadata = data.metadata || {};
  const mergedMetadata = mergeVariables(originalMetadata, newMetadata);

  const endpointAccessType = get(phDeployment, 'spec.endpoint.accessType', 'public');
  const endpointClients = get(phDeployment, 'spec.endpoint.clients', []);

  const spec: any = {
    updateTime: moment.utc().toISOString(),
    userId,
    userName: username,
    displayName: data.name,
    description: data.description,
    stop: false,
    predictors: [{
      name: 'predictor1',
      replicas: isUndefined(data.replicas) ? predictor.replicas : data.replicas ,
      modelImage: data.modelImage || predictor.modelImage,
      instanceType: data.instanceType || predictor.instanceType,
      imagePullSecret: isNull(data.imagePullSecret) ? null : data.imagePullSecret || predictor.imagePullSecret,
      metadata: mergedMetadata,
    }],
    endpoint: {
      accessType: data.endpointAccessType || endpointAccessType,
      clients: endpointClients
    },
  };
  const updated = await context.crdClient.phDeployments.patch(args.where.id, {spec});
  return transform(updated, context.kcAdminClient);
};

export const deploy = async (root, args, context: Context) => {
  const {crdClient, userId, username} = context;
  const {id} = args.where;
  const phDeployment = await crdClient.phDeployments.get(id);
  const groupId = phDeployment.spec.groupId;
  await canUserMutate(userId, groupId, context);

  const spec = {
    updateTime: moment.utc().toISOString(),
    userId,
    userName: username,
    stop: false
  } as any;
  const updated = await context.crdClient.phDeployments.patch(args.where.id, {spec});
  return transform(updated, context.kcAdminClient);
};

export const stop = async (root, args, context: Context) => {
  const {crdClient, userId, username} = context;
  const {id} = args.where;
  const phDeployment = await crdClient.phDeployments.get(id);
  const groupId = phDeployment.spec.groupId;
  await canUserMutate(userId, groupId, context);

  const spec = {
    updateTime: moment.utc().toISOString(),
    userId,
    userName: username,
    stop: true
  } as any;
  const updated = await context.crdClient.phDeployments.patch(args.where.id, {spec});
  return transform(updated, context.kcAdminClient);
};

export const destroy = async (root, args, context: Context) => {
  const {id} = args.where;
  await context.crdClient.phDeployments.del(id);
  return {id};
};

export interface PhDeploymentClient {
  id: string;
  deploymentId: string;
  name: string;
}

export interface PhDeploymentClientMutationInput {
  deploymentId: string;
  name: string;
  token: string;
}

const htpasswd = (username: string, password: string) => {
  return `${username}:${md5(password)}`;
};

export const createClient = async (root, args, context: Context) => {
  const data: PhDeploymentClientMutationInput = args.data;
  const {crdClient, userId, username} = context;
  const phDeployment = await crdClient.phDeployments.get(data.deploymentId);

  await canUserMutate(context.userId, phDeployment.spec.groupId, context);

  const predictor = phDeployment.spec.predictors[0];

  const accessType = get(phDeployment, 'spec.endpoint.accessType', 'public');
  let clients = get(phDeployment, 'spec.endpoint.clients', []);

  // remove the same name client
  clients = clients.filter(client => client.name !== data.name);
  const newClient = {
    name: data.name,
    token: htpasswd(data.name, data.token)
  };
  clients.push(newClient);

  const spec: any = {
    updateTime: phDeployment.spec.updateTime,
    userId,
    userName: phDeployment.spec.userName,
    displayName: phDeployment.spec.displayName,
    description: phDeployment.spec.description,
    stop: false,
    predictors: [predictor],
    endpoint: {
      accessType,
      clients,
    }
  };
  const updated = await context.crdClient.phDeployments.patch(data.deploymentId, {spec});

  return transform(updated, context.kcAdminClient);
};

export const destroyClient = async (root, args, context: Context) => {
  const {deploymentId, name} = args.where;
  const {crdClient, userId, username} = context;
  const phDeployment = await crdClient.phDeployments.get(deploymentId);

  await canUserMutate(context.userId, phDeployment.spec.groupId, context);

  const predictor = phDeployment.spec.predictors[0];

  const accessType = get(phDeployment, 'spec.endpoint.accessType', 'public');
  let clients = get(phDeployment, 'spec.endpoint.clients', []);

  // remove the same name client
  clients = clients.filter(client => client.name !== name);

  const spec: any = {
    updateTime: phDeployment.spec.updateTime,
    userId,
    userName: phDeployment.spec.userName,
    displayName: phDeployment.spec.displayName,
    description: phDeployment.spec.description,
    stop: false,
    predictors: [predictor],
    endpoint: {
      accessType,
      clients,
    }
  };
  const updated = await context.crdClient.phDeployments.patch(deploymentId, {spec});

  return transform(updated, context.kcAdminClient);
};
