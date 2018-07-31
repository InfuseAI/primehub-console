import KcAdminClient from 'keycloak-admin';
import { Item } from '../crdClient/customResource';
import CrdClient, { ContainerSpec } from '../crdClient/crdClientImpl';
import { toRelay, getFromAttr } from './utils';
import { mapValues, find } from 'lodash';
import {unflatten} from 'flat';
import { EVERYONE_GROUP_ID } from './constant';

interface Context {
  realm: string;
  kcAdminClient: KcAdminClient;
  crdClient: CrdClient;
}

export const mapping = (item: Item<ContainerSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    description: item.metadata.description,
    cpuLimit: item.spec['limits.cpu'],
    memoryLimit: item.spec['limits.memory'],
    gpuLimit: item.spec['limits.nvidia.com/gpu'] || 0,
    cpuRequest: item.spec['requests.cpu'],
    memoryRequest: item.spec['requests.memory']
  };
};

const listQuery = async (crdClient: CrdClient) => {
  const containers = await crdClient.containers.list();
  return containers.map(mapping);
};

export const query = async (root, args, context: Context) => {
  return listQuery(context.crdClient);
};

export const connectionQuery = async (root, args, context: Context) => {
  const rows = await listQuery(context.crdClient);
  return toRelay(rows);
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const container = await context.crdClient.containers.get(id);
  return mapping(container);
};

export const typeResolvers = {
  global: async (parent, args, context: Context) => {
    // find in everyOne group
    const roles = await context.kcAdminClient.groups.listRealmRoleMappings({
      id: EVERYONE_GROUP_ID
    });
    return Boolean(find(roles, role => role.name.slice(3) === parent.name));
  }
};
