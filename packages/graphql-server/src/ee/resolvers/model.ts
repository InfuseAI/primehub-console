import { get, find, isEmpty } from 'lodash';
import { ApolloError } from 'apollo-server';
import fetch from 'node-fetch';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { keycloakMaxCount } from '../../resolvers/constant';
import { Context } from '../../resolvers/interface';
import { toRelay, filter, paginate, extractPagination } from '../../resolvers/utils';
import { transform as transformGroup } from '../../resolvers/groupUtils';
import * as logger from '../../logger';
import { ErrorCodes } from '../../errorCodes';
import { memoize } from '../../cache/memoize';
import { query as phDeploymentQuery } from './phDeployment';
import { Config } from '../../config';
import AbortController from 'abort-controller';
const { INTERNAL_ERROR } = ErrorCodes;

// mlflow api endpoints
const API_PREFIX = '/api/2.0/mlflow';
const API_PREFIX_PREVIEW = '/api/2.0/preview/mlflow';

const API_ENDPOINT_MODEL_LIST = '/registered-models/search';
const API_ENDPOINT_MODEL_GET = '/registered-models/get';
const API_ENDPOINT_MODEL_CREATE = '/registered-models/create';
const API_ENDPOINT_MODEL_VERSION_SEARCH = '/model-versions/search';
const API_ENDPOINT_MODEL_VERSION_GET = '/model-versions/get';
const API_ENDPOINT_MODEL_VERSION_CREATE = '/model-versions/create';
const API_ENDPOINT_RUN_GET = '/runs/get';
const API_ENDPOINT_RUN_SEARCH = '/runs/search';
const API_ENDPOINT_ARTIFACT_LIST = '/artifacts/list';
const API_ENDPOINT_EXPERIMENT_LIST = '/experiments/list';

const TRACKING_URI_NOT_FOUND = 'TRACKING_URI_NOT_FOUND';
const MLFLOW_SETTING_NOT_FOUND = 'MLFLOW_SETTING_NOT_FOUND';

const requestApi = async (trackingUri: string, endpoint: string, auth = null, params = {}, method = 'GET') => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    const url = new URL(`${trackingUri}${API_PREFIX}${endpoint}`);

    const init: any = {
      signal: controller.signal,
      method,
    };
    if (auth) {
      init.headers = {
        Authorization: auth,
      };
    }
    if (method === 'GET') {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    } else if (method === 'POST') {
      init.body = JSON.stringify(params);
    }
    const response = await fetch(url, init);
    if (response.status === 404) {
      logger.info({
        component: logger.components.model,
        type: 'MLFLOW_API_FALLBACK',
        message: `Use ${trackingUri}${API_PREFIX_PREVIEW}${endpoint} instead of ${trackingUri}${API_PREFIX}${endpoint}`,
      });
      url.pathname = `${API_PREFIX_PREVIEW}${endpoint}`;
      const responsePreview = await fetch(url, init);
      return responsePreview.json();
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const getGroupId = async (groupName: string, kcAdminClient: KeycloakAdminClient) => {
  const groups = await kcAdminClient.groups.find({max: keycloakMaxCount});
  const groupData = find(groups, ['name', groupName]);
  return get(groupData, 'id', '');
};

const getMLflowSetting = async (groupName: string, kcAdminClient: KeycloakAdminClient) => {
  const group = await kcAdminClient.groups.findOne({id: await getGroupId(groupName, kcAdminClient)});
  const transformed = transformGroup(group);
  if (transformed) {
    return transformed.mlflow;
  }
  return null;
};

const getTrackingUri = (mlflow: any) => {
  if (!mlflow.trackingUri) {
    throw new ApolloError('tracking uri not found', TRACKING_URI_NOT_FOUND);
  }
  return mlflow.trackingUri.replace(/\/$/, '');
};

const getAuth = (mlflow: any) => {
  if (mlflow && mlflow.trackingEnvs) {
    const token = mlflow.trackingEnvs.find(env => env.name === 'MLFLOW_TRACKING_TOKEN');
    if (token) {
      return `Bearer ${token.value}`;
    }
    const username = mlflow.trackingEnvs.find(env => env.name === 'MLFLOW_TRACKING_USERNAME');
    const password = mlflow.trackingEnvs.find(env => env.name === 'MLFLOW_TRACKING_PASSWORD');
    if (username && password) {
      const basic = btoa(`${username}:${password}`);
      return `Basic ${basic}`;
    }
  }
  return null;
};

const getRunResolver = (mlflow: any, runId: string) => async (root, args, context) => {
  if (runId) {
    const runJson = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_RUN_GET, getAuth(mlflow), { run_id: runId });
    return transformRun(runJson.run);
  }
  return null;
};

const getModelURI = (name: string, version: string) => {
  return 'models:/' + encodeURIComponent(name) + '/' + version;
};

const getDeployedBy = async (name: string, version: string, groupId: string, context: Context, memGetPhDeployments: any) => {
  const phdeployments = await memGetPhDeployments(null, {where: {groupId_in: [groupId]}}, context);
  const modelURI = getModelURI(name, version);
  const results = [];
  phdeployments.forEach(element => {
    if (element.modelURI === modelURI) {
      results.push({id: element.id, name: element.name});
    }
  });
  return results;
};

const transform = (item: any) => {
  return {
    name: item.name,
    creationTimestamp: item.creation_timestamp,
    lastUpdatedTimestamp: item.last_updated_timestamp,
    description: item.description,
    latestVersions: (item.latest_versions || []).map(v => {
      return {
        name: v.name,
        version: v.version,
        creationTimestamp: v.creation_timestamp,
        lastUpdatedTimestamp: v.last_updated_timestamp,
        description: v.description,
      };
    }),
  };
};

const transformVersion = (item: any, groupId: string, context: Context, mlflow: any, memGetPhDeployments: any) => {
  return {
    name: item.name,
    version: item.version,
    creationTimestamp: item.creation_timestamp,
    lastUpdatedTimestamp: item.last_updated_timestamp,
    description: item.description,
    source: item.source,
    run: getRunResolver(mlflow, item.run_id),
    modelURI: getModelURI(item.name, item.version),
    deployedBy: async () => getDeployedBy(item.name, item.version, groupId, context, memGetPhDeployments),
  };
};

const transformRun = (item: any) => {
  if (item.data && item.data.params) {
    const field = 'key';
    item.data.params.sort((a: any, b: any) => a[field].localeCompare(b[field]));
  }
  return {
    info: {
      runId: item.info.run_id,
      experimentId: item.info.experiment_id,
      status: item.info.status,
      startTime: item.info.start_time,
      endTime: item.info.end_time,
      artifactUri: item.info.artifact_uri,
      lifecycleStage: item.info.lifecycle_stage,
    },
    data: item.data,
  };
};

export const queryMLflow = async (root, args, context: Context) => {
  const where = args && args.where;

  const mlflow = await getMLflowSetting(where.group, context.kcAdminClient);
  if (!mlflow) {
    throw new ApolloError('mlflow setting not found', MLFLOW_SETTING_NOT_FOUND);
  }

  return mlflow;
};

export const queryMLflowRuns = async (root, args, context: Context) => {
  const mlflow = await queryMLflow(root, args, context);
  const where = args && args.where;
  const expJson = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_EXPERIMENT_LIST, getAuth(mlflow));
  if (expJson.error_code) {
    logger.error({
      component: logger.components.model,
      type: expJson.error_code,
      message: expJson.message,
    });
    throw new ApolloError(expJson.message);
  }
  const exp = expJson.experiments && expJson.experiments.find(e => e.name === where.experimentName);
  if (!exp) {
    logger.error({
      component: logger.components.model,
      type: 'MLFLOW_EXPERIMENT_NAME_NOT_FOUND',
      message: `experiment name '${where.experimentName}' doesn't exist`,
    });
    throw new ApolloError(`failed to list mlflow runs. experiment name '${where.experimentName}' doesn't exist`, INTERNAL_ERROR);
  }

  const params = { experiment_ids: [exp.experiment_id] };
  const json = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_RUN_SEARCH, getAuth(mlflow), params, 'POST');
  if (json.runs) {
    return json.runs.map(item => transformRun(item));
  } else if (json.error_code) {
    logger.error({
      component: logger.components.model,
      type: json.error_code,
      message: json.message,
    });
    throw new ApolloError(`failed to list mlflow runs by experiment name '${where.name}'`, json.error_code);
  } else {
    throw new ApolloError('failed to list mlflow runs', INTERNAL_ERROR);
  }
};

export const queryMLflowArtifact = async (root, args, context: Context) => {
  const mlflow = await queryMLflow(root, args, context);
  const where = args && args.where;
  const params: any = { run_id: where.runId };
  if (where.path) {
    params.path = where.path;
  }
  const json = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_ARTIFACT_LIST, getAuth(mlflow), params);
  if (json.root_uri) {
    return json;
  } else if (json.error_code) {
    logger.error({
      component: logger.components.model,
      type: json.error_code,
      message: json.message,
    });
    throw new ApolloError(`failed to list mlflow artifact by run id '${where.runId}'`, json.error_code);
  } else {
    throw new ApolloError('failed to list mlflow artifact', INTERNAL_ERROR);
  }
};

export const registerModel = async (root, args, context: Context) => {
  const mlflow = await queryMLflow(root, args, context);
  const where = args && args.where;

  const existing = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_MODEL_GET, getAuth(mlflow), { name: where.name });
  if (existing.error_code && existing.error_code === 'RESOURCE_DOES_NOT_EXIST') {
    const modelJson = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_MODEL_CREATE, getAuth(mlflow), {name: where.name}, 'POST');
    if (modelJson.error_code) {
      logger.error({
        component: logger.components.model,
        type: modelJson.error_code,
        message: modelJson.message,
      });
      throw new ApolloError(modelJson.message);
    }
  }
  const artifactParams = { run_id: where.runId, path: where.path };
  const artifactJson = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_ARTIFACT_LIST, getAuth(mlflow), artifactParams);
  if (artifactJson.error_code) {
    logger.error({
      component: logger.components.model,
      type: artifactJson.error_code,
      message: artifactJson.message,
    });
    throw new ApolloError(artifactJson.message);
  }
  if (!artifactJson.files) {
    logger.error({
      component: logger.components.model,
      type: 'MLFLOW_ARTIFACT_NOT_FOUND',
      message: `failed to register mlflow modmel. artifact path '${artifactJson.root_uri}${where.path}' not found`,
    });
    throw new ApolloError(`failed to register mlflow model. artifact path '${where.path}' not found`, INTERNAL_ERROR);
  }

  const params: any = {
    name: where.name,
    run_id: where.runId,
    source: `${artifactJson.root_uri}/${where.path}`,
  };

  const json = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_MODEL_VERSION_CREATE, getAuth(mlflow), params, 'POST');
  if (json.model_version) {
    return json.model_version;
  } else if (json.error_code) {
    logger.error({
      component: logger.components.model,
      type: json.error_code,
      message: json.message,
    });
    throw new ApolloError(`failed to register mlflow model by run id '${where.runId}'`, json.error_code);
  } else {
    throw new ApolloError('failed to register mlflow model', INTERNAL_ERROR);
  }
};

export const queryOne = async (root, args, context: Context) => {
  const mlflow = await queryMLflow(root, args, context);

  const where = args && args.where;
  const json = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_MODEL_GET, getAuth(mlflow), { name: where.name });
  if (json.registered_model) {
    return transform(json.registered_model);
  } else if (json.error_code) {
    logger.error({
      component: logger.components.model,
      type: json.error_code,
      message: json.message,
    });
    throw new ApolloError(`model '${where.name}' not found`, json.error_code);
  } else {
    throw new ApolloError('failed to get model', INTERNAL_ERROR);
  }
};

export const query = async (root, args, context: Context) => {
  const mlflow = await queryMLflow(root, args, context);

  const where = args && args.where;
  const json = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_MODEL_LIST, getAuth(mlflow));
  if (json.registered_models) {
    return paginate(json.registered_models.map(m => transform(m)), extractPagination(args));
  } else if (json.error_code) {
    logger.error({
      component: logger.components.model,
      type: json.error_code,
      message: json.message,
    });
  } else {
    return [];
  }
};

export const queryVersion = async (root, args, context: Context) => {
  const mlflow = await queryMLflow(root, args, context);
  const memGetPhDeployments = memoize(phDeploymentQuery, {cacheKey: () => 'phDeploymentQuery'});
  const groupId = await getGroupId(args.where.group, context.kcAdminClient);

  const where = args && args.where;
  const json = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_MODEL_VERSION_GET, getAuth(mlflow), { name: where.name, version: where.version });
  if (json.model_version) {
    return transformVersion(json.model_version, groupId, context, mlflow, memGetPhDeployments);
  } else if (json.error_code) {
    logger.error({
      component: logger.components.model,
      type: json.error_code,
      message: json.message,
    });
    throw new ApolloError(`model '${where.name}' version '${where.version}' not found`, json.error_code);
  } else {
    throw new ApolloError('failed to get model version', INTERNAL_ERROR);
  }
};

const listQueryVersions = async (root, args, context: Context) => {
  const mlflow = await queryMLflow(root, args, context);
  const memGetPhDeployments = memoize(phDeploymentQuery, {cacheKey: () => 'phDeploymentQuery'});
  const groupId = await getGroupId(args.where.group, context.kcAdminClient);

  const where = args && args.where;
  const search = `name='${where.name}'`;
  const json = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_MODEL_VERSION_SEARCH, getAuth(mlflow), { filter: search });
  if (json.model_versions) {
    const modelVersions = await Promise.all(json.model_versions.map(async m => {
      return transformVersion(m, groupId, context, mlflow, memGetPhDeployments);
    }));
    return filter(modelVersions, {where});
  } else if (json.error_code) {
    logger.error({
      component: logger.components.model,
      type: json.error_code,
      message: json.message,
    });
  } else {
    return [];
  }
};

export const queryVersions = async (root, args, context: Context) => {
  const modelVersions = await listQueryVersions(root, args, context);
  return paginate(modelVersions, extractPagination(args));
};

export const connectionQueryVersions = async (root, args, context: Context) => {
  const modelVersions = await listQueryVersions(root, args, context);
  return toRelay(modelVersions, extractPagination(args));
};

interface ModelTelemetryMetrics {
  groupsMLflowEnabled: number;
  models: number;
}
export const getModelsTelemetry = async (config: Config,  kcAdminClient: KeycloakAdminClient): Promise<ModelTelemetryMetrics> => {
  let groups = await kcAdminClient.groups.find({max: 100000});
  groups = groups.filter(group => group.id !== config.keycloakEveryoneGroupId);
  const results = await Promise.all(groups.map(async group => {
    try {
      const mlflow = await getMLflowSetting(group.name, kcAdminClient);
      if (!mlflow || isEmpty(mlflow.trackingUri)) {
        return {
          groupsMLflowEnabled: 0,
          models: 0,
        };
      }
      const json = await requestApi(getTrackingUri(mlflow), API_ENDPOINT_MODEL_LIST, getAuth(mlflow));
      return {
        groupsMLflowEnabled: 1,
        models: json.registered_models.length,
      };
    } catch (e) {
      return {
        groupsMLflowEnabled: 0,
        models: 0,
      };
    }
  }));

  const metric = results.reduce((acc, value) => {
    acc.groupsMLflowEnabled += value.groupsMLflowEnabled;
    acc.models += value.models;
    return acc;
  }, {models: 0, groupsMLflowEnabled: 0});

  return metric;
};
