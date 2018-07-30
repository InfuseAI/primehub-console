import KcAdminClient from 'keycloak-admin';
import { toRelay, getFromAttr } from './utils';
import CrdClient from '../crdClient/crdClientImpl';
import { mapValues, find } from 'lodash';
import {unflatten} from 'flat';
import { EVERYONE_GROUP_ID } from './constant';
import { mapping } from './instanceType';

interface Context {
  realm: string;
  kcAdminClient: KcAdminClient;
  crdClient: CrdClient;
}

const listQuery = async (kcAdminClient: KcAdminClient) => {
  let groups = await kcAdminClient.groups.find();
  // filter out everyone
  groups = groups.filter(group => group.id !== EVERYONE_GROUP_ID);
  // inject more fields from single query
  const fetchedGroups = await Promise.all(groups.map(group => kcAdminClient.groups.findOne({id: group.id})));
  return fetchedGroups;
};

export const query = async (root, args, context: Context) => {
  return listQuery(context.kcAdminClient);
};

export const connectionQuery = async (root, args, context: Context) => {
  const kcAdminClient = context.kcAdminClient;
  let groups = await kcAdminClient.groups.find();
  // filter out everyone
  groups = groups.filter(group => group.id !== EVERYONE_GROUP_ID);
  return toRelay(groups);
};

export const queryOne = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const group = await kcAdminClient.groups.findOne({id: groupId});
  return group;
};

export const typeResolvers = {
  canUseGpu: async (parent, args, context: Context) =>
    getFromAttr('canUseGpu', parent.attributes, false, v => v === 'true'),

  gpuQuota: async (parent, args, context: Context) =>
    getFromAttr('gpuQuota', parent.attributes, 0, parseFloat),

  diskQuota: async (parent, args, context: Context) =>
    getFromAttr('diskQuota', parent.attributes, '10GB'),

  displayName: async (parent, args, context: Context) =>
    getFromAttr('displayName', parent.attributes, parent.name),

  members: async (parent, args, context: Context) => {
    try {
      return await context.kcAdminClient.groups.listMembers({
        id: parent.id
      });
    } catch (err) {
      return [];
    }
  },

  instanceTypes: async (parent, args, context: Context) => {
    // get role-mappings prefixed with mt_
    // map with all resource on crd
    let roles = await context.kcAdminClient.groups.listRealmRoleMappings({
      id: parent.id
    });
    roles = roles.filter(role => role.name.startsWith('mt_'));
    const machineTypeNames = roles.map(role => role.name.slice(3));
    const instanceTypes = await Promise.all(machineTypeNames.map(name => {
      return context.crdClient.instanceTypes.get(name);
    }));
    return instanceTypes.map(mapping);
  }
};
