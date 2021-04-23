import { get, find } from 'lodash';
import { ApolloError } from 'apollo-server';
import fetch from 'node-fetch';
import { Context } from '../../resolvers/interface';
import { isGroupMember } from '../../resolvers/utils';

// mlflow api endpoints
const API_ENDPOINT_MODEL_LIST = '/api/2.0/preview/mlflow/registered-models/list';
const API_ENDPOINT_MODEL_GET = '/api/2.0/preview/mlflow/registered-models/get';
const API_ENDPOINT_MODEL_VERSION_LIST_LATEST = '/api/2.0/preview/mlflow/registered-models/get-latest-versions'
const API_ENDPOINT_MODEL_VERSION_GET = '/api/2.0/preview/mlflow/model-versions/get';
const API_ENDPOINT_RUN_GET = '/api/2.0/preview/mlflow/runs/get';

// error const
const NOT_AUTH_ERROR = 'NOT_AUTH';

const requestApi = async (trackingUri: string, endpoint: string, params = {}) => {
  let url = new URL(`${trackingUri}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url);
  return await response.json();
};

const getTrackingUri = (group: string) => {
  // TODO: get tracking uri from group
  return 'http://localhost:5000';
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
        // TODO: implement run structure
        run: {},
      }
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

export const queryOne = async (root, args, context: Context) => {
  const {userId, kcAdminClient} = context;
  const where = args && args.where;
  const viewable = await isGroupMember(userId, where.group, kcAdminClient);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  const json = await requestApi(getTrackingUri(where.group), API_ENDPOINT_MODEL_GET, { name: where.name });
  return transform(json.registered_model);
};

export const query = async (root, args, context: Context) => {
  const {userId, kcAdminClient} = context;
  const where = args && args.where;
  const viewable = await isGroupMember(userId, where.group, kcAdminClient);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  const json = await requestApi(getTrackingUri(where.group), API_ENDPOINT_MODEL_LIST);
  return json.registered_models.map(m => transform(m));
};

export const queryVersion = async (root, args, context: Context) => {
  const {userId, kcAdminClient} = context;
  const where = args && args.where;
  const viewable = await isGroupMember(userId, where.group, kcAdminClient);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  const trackingUri = getTrackingUri(where.group);
  const json = await requestApi(trackingUri, API_ENDPOINT_MODEL_VERSION_GET, { name: where.name, version: where.version });
  json.model_version.run = await getRun(trackingUri, json.model_version.run_id);
  return transformVersion(json.model_version);
};

export const queryVersions = async (root, args, context: Context) => {
  const {userId, kcAdminClient} = context;
  const where = args && args.where;
  const viewable = await isGroupMember(userId, where.group, kcAdminClient);
  if (!viewable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  const trackingUri = getTrackingUri(where.group);
  const json = await requestApi(trackingUri, API_ENDPOINT_MODEL_VERSION_LIST_LATEST, { name: where.name });
  return json.model_versions.map(async m => {
    m.run = await getRun(trackingUri, m.run_id);
    return transformVersion(m);
  });
}
