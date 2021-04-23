import KcAdminClient from 'keycloak-admin';
import { keycloakMaxCount } from '../../resolvers/constant';
import { client as kubeClient } from '../../crdClient/crdClientImpl';
import { Context } from '../../resolvers/interface';
import { createConfig } from '../../config';
import fetch from 'node-fetch';

const config = createConfig();

const API_ENDPOINT_MODEL_LIST = '/api/2.0/preview/mlflow/registered-models/list';
const API_ENDPOINT_MODEL_GET = '/api/2.0/preview/mlflow/registered-models/get';

const getTrackingUri = (group: string) => {
  // TODO: get tracking uri from group
  return 'http://localhost:5000';
};

const requestApi = async (trackingUri: string, endpoint: string, params = {}) => {
  let url = new URL(`${trackingUri}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url);
  return await response.json();
};

const transform = (item: any) => {
  const model = {
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
  return model;
};

export const queryOne = async (root, args, context: Context) => {
  const where = args && args.where;
  // TODO: check group admin

  const json = await requestApi(getTrackingUri(where.group), API_ENDPOINT_MODEL_GET, { name: where.name });
  return transform(json.registered_model);
};

export const query = async (root, args, context: Context) => {
  const where = args && args.where;
  // TODO: check group admin

  const json = await requestApi(getTrackingUri(where.group), API_ENDPOINT_MODEL_LIST);
  return json.registered_models.map(m => transform(m));
};
