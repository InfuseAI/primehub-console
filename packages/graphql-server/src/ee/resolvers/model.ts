import { get, find } from 'lodash';
import { ApolloError } from 'apollo-server';
import fetch from 'node-fetch';
import KcAdminClient from 'keycloak-admin';
import { keycloakMaxCount } from '../../resolvers/constant';
import { Context } from '../../resolvers/interface';
import { toRelay, filter, paginate, extractPagination } from '../../resolvers/utils';
import { transform as transformGroup } from '../../resolvers/groupUtils';
import * as logger from '../../logger';
import { ErrorCodes } from '../../errorCodes';
import { memoize } from '../../cache/memoize';
import { query as phDeploymentQuery } from './phDeployment';
const { NOT_AUTH_ERROR, INTERNAL_ERROR } = ErrorCodes;

// mlflow api endpoints
const API_ENDPOINT_MODEL_LIST = '/api/2.0/preview/mlflow/registered-models/list';
const API_ENDPOINT_MODEL_GET = '/api/2.0/preview/mlflow/registered-models/get';
const API_ENDPOINT_MODEL_VERSION_SEARCH = '/api/2.0/preview/mlflow/model-versions/search';
const API_ENDPOINT_MODEL_VERSION_GET = '/api/2.0/preview/mlflow/model-versions/get';
const API_ENDPOINT_RUN_GET = '/api/2.0/preview/mlflow/runs/get';

const TRACKING_URI_NOT_FOUND = 'TRACKING_URI_NOT_FOUND';
const MLFLOW_SETTING_NOT_FOUND = 'MLFLOW_SETTING_NOT_FOUND';

const requestApi = async (trackingUri: string, endpoint: string, auth = null, params = {}) => {
  const url = new URL(`${trackingUri}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const init: any = {};
  if (auth) {
    init.headers = {
      Authorization: auth,
    };
  }
  const response = await fetch(url, init);
  return response.json();
};

const getGroupId = async (groupName: string, kcAdminClient: KcAdminClient) => {
  const groups = await kcAdminClient.groups.find({max: keycloakMaxCount});
  const groupData = find(groups, ['name', groupName]);
  return get(groupData, 'id', '');
};

const getMLflowSetting = async (groupName: string, kcAdminClient: KcAdminClient) => {
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
  return mlflow.trackingUri;
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
    run: getRunResolver(mlflow, item.run_id),
    modelURI: getModelURI(item.name, item.version),
    deployedBy: async () => getDeployedBy(item.name, item.version, groupId, context, memGetPhDeployments),
  };
};

const transformRun = (item: any) => {
  if (item.data && item.data.params) {
    item.data.params.sort((a: any, b: any) => { return a["key"].localeCompare(b["key"]); });
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
    return filter(modelVersions, where);
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
