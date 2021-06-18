import { Context } from '../../resolvers/interface';
import {
  toRelay, filter, paginate, extractPagination, getFromAttr, parseMemory, mergeVariables, getGroupIdsByUser
} from '../../resolvers/utils';
import { validateLicense, validateModelDeployQuota } from './utils';
import {
  PhDeploymentSpec, PhDeploymentStatus, PhDeploymentPhase, client as kubeClient
} from '../../crdClient/crdClientImpl';
import CustomResource, { Item } from '../../crdClient/customResource';
import { orderBy, omit, get, isUndefined, isNil, isEmpty, isNull, capitalize, intersection } from 'lodash';
import * as moment from 'moment';
import { ApolloError } from 'apollo-server';
import KeycloakAdminClient from 'keycloak-admin';
import { mapping } from '../../resolvers/instanceType';
import * as logger from '../../logger';
import { keycloakMaxCount } from '../../resolvers/constant';
import { isUserAdmin } from '../../resolvers/user';
import md5 = require('apache-md5');

const EXCEED_QUOTA_ERROR = 'EXCEED_QUOTA';
const NOT_AUTH_ERROR = 'NOT_AUTH';
const ILLEGAL_ENV_NAME = 'ILLEGAL_ENV_NAME';

interface EnvVar {
  name: string;
  value: string;
}

export interface PhDeployment {
  id: string;
  status: PhDeploymentPhase;
  message: string;
  name: string;
  description: string;
  updateMessage: string;
  env: EnvVar[];
  metadata: Record<string, any>;
  stop: boolean;
  userId: string;
  userName: string;
  groupId: string;
  groupName: string;
  endpoint: string;
  modelImage: string;
  modelURI: string;
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
  modelURI: string;
  imagePullSecret: string;
  description: string;
  updateMessage: string;
  metadata: Record<string, any>;
  env: EnvVar[];
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
  const endpointClients = get(spec, 'endpoint.clients', []).map(clientItem => {
    return {
      name: clientItem.name,
    };
  });
  const endpointAccessType = get(spec, 'endpoint.accessType', 'public');
  return {
    id: `${id}-${time}`,
    name: spec.displayName,
    description: spec.description,
    updateMessage: spec.updateMessage,
    userId: spec.userId,
    userName: spec.userName,
    groupName,
    groupId: spec.groupId,
    stop: isUndefined(spec.stop) ? false : spec.stop,
    lastUpdatedTime: spec.updateTime,
    env: spec.env,

    endpointClients,
    endpointAccessType,

    // predictator
    modelImage: predictator.modelImage,
    modelURI: predictator.modelURI,
    replicas: predictator.replicas,
    imagePullSecret: predictator.imagePullSecret,
    instanceType: predictator.instanceType,
    metadata: predictator.metadata,
  };
};

// tslint:disable-next-line:max-line-length
export const transform = async (item: Item<PhDeploymentSpec, PhDeploymentStatus>, kcAdminClient: KeycloakAdminClient): Promise<PhDeployment> => {
  const groupName = item.spec.groupName;
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
    updateMessage: item.spec.updateMessage,
    userId: item.spec.userId,
    userName: item.spec.userName,
    groupId: item.spec.groupId,
    stop: item.spec.stop,
    env: item.spec.env,
    groupName,

    // status
    status,
    message: get(item, 'status.message'),
    endpoint: get(item, 'status.endpoint'),
    availableReplicas: get(item, 'status.availableReplicas'),

    // predictator
    modelImage: predictator.modelImage,
    modelURI: predictator.modelURI,
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
    name: data.id.toLowerCase(),
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
    updateMessage: data.updateMessage,
    env: data.env,
    predictors: [{
      name: 'predictor1',
      replicas: data.replicas,
      modelImage: data.modelImage,
      modelURI: data.modelURI,
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
    if (!isNil(projectQuotaGpu) && instanceTypeGpuLimit > projectQuotaGpu) {
      throw new ApolloError('Group Gpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }
  }

  // check if cpu quota exceed
  if (!isNil(instanceTypeCpuLimit)) {
    if (!isNil(projectQuotaCpu) && instanceTypeCpuLimit > projectQuotaCpu) {
      throw new ApolloError('Group Cpu Quota exceeded', EXCEED_QUOTA_ERROR);
    }
  }

  // check if memory quota exceed
  if (!isNil(instanceTypeMemoryLimit)) {
    if (!isNil(projectQuotaMemory) && instanceTypeMemoryLimit > projectQuotaMemory) {
      throw new ApolloError('Group Memory exceeded', EXCEED_QUOTA_ERROR);
    }
  }
};

const validateEnvVars = (envList: EnvVar[]) => {
  const msg = (name: string) => {
    return `EnvVar name "${name}" is invalid, a valid environment variable name must consist of alphabetic characters, digits, '_', '-', or '.', and must not start with a digit (e.g. 'my.env-name',  or 'MY_ENV.NAME',  or 'MyEnvName1', regex used for validation is '[-._a-zA-Z][-._a-zA-Z0-9]*')"}`;
  };
  const rules = /^[-\._a-zA-Z][-\._a-zA-Z0-9]*$/;

  envList.forEach(env => {
    if (!rules.test(env.name)) {
      throw new ApolloError(msg(env.name), ILLEGAL_ENV_NAME);
    }
  });
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

  if (where && where.mine) {
    where.userId_eq = currentUserId;
  }

  const userGroups = await getGroupIdsByUser(context, currentUserId);
  where.groupId_in = isEmpty(where.groupId_in) ? userGroups : intersection(where.groupId_in, userGroups);

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
  await validateModelDeployQuota(context);
  await validateQuota(context, data.groupId, data.instanceType);
  if (data.env && data.env.length > 0) {
    validateEnvVars(data.env);
  }
  const mutable = await canUserMutate(context.userId, data.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }
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
  if (data.env && data.env.length > 0) {
    validateEnvVars(data.env);
  }
  const mutable = await canUserMutate(userId, groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

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
    updateMessage: data.updateMessage,
    env: data.env,
    stop: false,
    predictors: [{
      name: 'predictor1',
      replicas: isUndefined(data.replicas) ? predictor.replicas : data.replicas ,
      modelImage: data.modelImage || predictor.modelImage,
      modelURI: isNil(data.modelURI) ? predictor.modelURI : data.modelURI ,
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
  const mutable = await canUserMutate(userId, groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  const spec = {
    updateTime: moment.utc().toISOString(),
    userId,
    userName: username,
    updateMessage: 'Deployment Started',
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
  const mutable = await canUserMutate(userId, groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  const spec = {
    updateTime: moment.utc().toISOString(),
    userId,
    userName: username,
    updateMessage: 'Deployment Stopped',
    stop: true
  } as any;
  const updated = await context.crdClient.phDeployments.patch(args.where.id, {spec});
  return transform(updated, context.kcAdminClient);
};

export const destroy = async (root, args, context: Context) => {
  const {crdClient, userId, username} = context;
  const {id} = args.where;
  const phDeployment = await crdClient.phDeployments.get(id);
  const groupId = phDeployment.spec.groupId;
  const mutable = await canUserMutate(userId, groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  await context.crdClient.phDeployments.del(id);
  return {id};
};

export const available = async (root, args, context: Context) => {
  const {crdClient} = context;
  const where = args && args.where;
  if (where) {
    const rules = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!rules.test(where.id)) {
      return false;
    }
    try {
      await crdClient.phDeployments.get(where.id);
    } catch (error) {
      if (error.data && error.data.code && error.data.code === 'RESOURCE_NOT_FOUND') {
        return true;
      }
      logger.info({
        component: logger.components.phDeployment,
        type: 'GET_DEPLOYMENT_ERROR',
        id: where.id,
      });
    }
  }
  return false;
};

export interface PhDeploymentClient {
  id: string;
  deploymentId: string;
  name: string;
}

export interface PhDeploymentClientMutationInput {
  deploymentId: string;
  name: string;
}

const genRandomString = () => {
  return Math.random().toString(36).slice(2);
};

export const createClient = async (root, args, context: Context) => {
  const data: PhDeploymentClientMutationInput = args.data;
  const {crdClient, userId, username} = context;
  const phDeployment = await crdClient.phDeployments.get(data.deploymentId);

  const mutable = await canUserMutate(userId, phDeployment.spec.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  const predictor = phDeployment.spec.predictors[0];

  const accessType = get(phDeployment, 'spec.endpoint.accessType', 'public');
  let clients = get(phDeployment, 'spec.endpoint.clients', []);

  // remove the same name client
  clients = clients.filter(client => client.name !== data.name);
  const plainTextToken = genRandomString();
  const newClient = {
    name: data.name,
    token: md5(plainTextToken)
  };
  clients.push(newClient);

  const spec: any = {
    updateTime: phDeployment.spec.updateTime,
    userId,
    userName: phDeployment.spec.userName,
    displayName: phDeployment.spec.displayName,
    description: phDeployment.spec.description,
    updateMessage: 'Create the client ' + data.name,
    stop: phDeployment.spec.stop || false,
    predictors: [predictor],
    endpoint: {
      accessType,
      clients,
    }
  };
  await context.crdClient.phDeployments.patch(data.deploymentId, {spec});

  return {
    name: data.name,
    plainTextToken
  };
};

export const destroyClient = async (root, args, context: Context) => {
  const {deploymentId, name} = args.where;
  const {crdClient, userId, username} = context;
  const phDeployment = await crdClient.phDeployments.get(deploymentId);

  const mutable = await canUserMutate(userId, phDeployment.spec.groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

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
    updateMessage: 'Delete the client ' + name,
    stop: phDeployment.spec.stop || false,
    predictors: [predictor],
    endpoint: {
      accessType,
      clients,
    }
  };
  const updated = await context.crdClient.phDeployments.patch(deploymentId, {spec});

  return transform(updated, context.kcAdminClient);
};
