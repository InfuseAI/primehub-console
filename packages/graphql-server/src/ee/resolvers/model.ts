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
const { NOT_AUTH_ERROR, INTERNAL_ERROR } = ErrorCodes;

// mlflow api endpoints
const API_ENDPOINT_MODEL_LIST = '/api/2.0/preview/mlflow/registered-models/list';
const API_ENDPOINT_MODEL_GET = '/api/2.0/preview/mlflow/registered-models/get';
const API_ENDPOINT_MODEL_VERSION_SEARCH = '/api/2.0/preview/mlflow/model-versions/search';
const API_ENDPOINT_MODEL_VERSION_GET = '/api/2.0/preview/mlflow/model-versions/get';
const API_ENDPOINT_RUN_GET = '/api/2.0/preview/mlflow/runs/get';

const TRACKING_URI_NOT_FOUND = 'TRACKING_URI_NOT_FOUND';
const MLFLOW_SETTING_NOT_FOUND = 'MLFLOW_SETTING_NOT_FOUND';

const requestApi = async (trackingUri: string, endpoint: string, params = {}) => {
  const url = new URL(`${trackingUri}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url);
  return response.json();
};

const getMLflowSetting = async (groupName: string, kcAdminClient: KcAdminClient) => {
  const groups = await kcAdminClient.groups.find({max: keycloakMaxCount});
  const groupData = find(groups, ['name', groupName]);
  const group = await kcAdminClient.groups.findOne({id: get(groupData, 'id', '')});
  const transformed = transformGroup(group);
  if (transformed) {
    return transformed.mlflow;
  }
  return null;
};

const getTrackingUri = async (groupName: string, kcAdminClient: KcAdminClient) => {
  const mlflow = await getMLflowSetting(groupName, kcAdminClient);
  if (mlflow) {
    return mlflow.trackingUri;
  }
  return null;
};

const getRun = async (trackingUri: string, runId: string) => {
  if (runId) {
    const runJson = await requestApi(trackingUri, API_ENDPOINT_RUN_GET, { run_id: runId });
    return runJson.run;
  }
  return null;
};

const transform = (item: any) => {
  return {
    name: item.name,
    creationTimestamp: item.creation_timestamp,
    lastUpdatedTimestamp: item.last_updated_timestamp,
    description: item.description,
    latestVersions: item.latest_versions.map(v => {
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

const transformVersion = (item: any) => {
  return {
    name: item.name,
    version: item.version,
    creationTimestamp: item.creation_timestamp,
    lastUpdatedTimestamp: item.last_updated_timestamp,
    description: item.description,
    run: item.run ? transformRun(item.run) : null,
  };
};

const transformRun = (item: any) => {
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
}

export const queryOne = async (root, args, context: Context) => {
  const where = args && args.where;

  const trackingUri = await getTrackingUri(where.group, context.kcAdminClient);
  if (!trackingUri) {
    throw new ApolloError('tracking uri not found', TRACKING_URI_NOT_FOUND);
  }

  const json = await requestApi(trackingUri, API_ENDPOINT_MODEL_GET, { name: where.name });
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
  const where = args && args.where;

  const trackingUri = await getTrackingUri(where.group, context.kcAdminClient);
  if (!trackingUri) {
    throw new ApolloError('tracking uri not found', TRACKING_URI_NOT_FOUND);
  }

  const json = await requestApi(trackingUri, API_ENDPOINT_MODEL_LIST);
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
  const where = args && args.where;

  const trackingUri = await getTrackingUri(where.group, context.kcAdminClient);
  if (!trackingUri) {
    throw new ApolloError('tracking uri not found', TRACKING_URI_NOT_FOUND);
  }

  const json = await requestApi(trackingUri, API_ENDPOINT_MODEL_VERSION_GET, { name: where.name, version: where.version });
  if (json.model_version) {
    json.model_version.run = await getRun(trackingUri, json.model_version.run_id);
    return transformVersion(json.model_version);
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

const listQueryVersions = async (where: any, context: Context) => {
  const trackingUri = await getTrackingUri(where.group, context.kcAdminClient);
  if (!trackingUri) {
    throw new ApolloError('tracking uri not found', TRACKING_URI_NOT_FOUND);
  }

  const search = `name='${where.name}'`;
  const json = await requestApi(trackingUri, API_ENDPOINT_MODEL_VERSION_SEARCH, { filter: search });
  if (json.model_versions) {
    const modelVersions = json.model_versions.map(async m => {
      m.run = await getRun(trackingUri, m.run_id);
      return transformVersion(m);
    });
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
  const where = args && args.where;
  const modelVersions = await listQueryVersions(where, context);
  return paginate(modelVersions, extractPagination(args));
};

export const connectionQueryVersions = async (root, args, context: Context) => {
  const where = args && args.where;
  const modelVersions = await listQueryVersions(where, context);
  return toRelay(modelVersions, extractPagination(args));
};
