import KcAdminClient from 'keycloak-admin';
import { toRelay } from './utils';
import { mapValues, find } from 'lodash';
import {unflatten} from 'flat';
import { EVERYONE_GROUP_ID } from './constant';

interface Context {
  realm: string;
  kcAdminClient: KcAdminClient;
}

export const query = async (root, args, context: Context) => {
  const kcAdminClient = context.kcAdminClient;
  const users = await kcAdminClient.users.find();
  return users;
};

export const connectionQuery = async (root, args, context: Context) => {
  const kcAdminClient = context.kcAdminClient;
  const users = await kcAdminClient.users.find();
  return toRelay(users);
};

export const queryOne = async (root, args, context: Context) => {
  const userId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const user = await kcAdminClient.users.findOne({id: userId});
  return user;
};

export const typeResolvers = {
  isAdmin: async (parent, args, context: Context) => {
    const userId = parent.id;
    // admin is determined by user's role
    const {realm, kcAdminClient} = context;

    if (realm === 'master') {
      // check if user has admin role
      const roles = await kcAdminClient.users.listRealmRoleMappings({
        id: userId
      });
      return Boolean(find(roles, role => role.name === 'admin'));
    } else {
      // if realm is not master
      // check if user has client role-mappings: realm-management/realm-admin
      const clients = await kcAdminClient.clients.find();
      const realmManagementClient = clients.find(client => client.name === 'realm-management');
      const clientRoles = await kcAdminClient.users.listClientRoleMappings({
        id: userId,
        clientUniqueId: realmManagementClient.id
      });
      return Boolean(find(clientRoles, role => role.name === 'realm-admin'));
    }
  },

  personalDiskQuota: async (parent, args, context: Context) => {
    const personalDiskQuota =
      parent.attributes && parent.attributes.personalDiskQuota && parent.attributes.personalDiskQuota[0];

    // get defaultUserDiskQuota from system
    if (!personalDiskQuota) {
      const {attributes} = await context.kcAdminClient.groups.findOne({id: EVERYONE_GROUP_ID});
      const defaultUserDiskQuota =
        attributes && attributes.defaultUserDiskQuota && attributes.defaultUserDiskQuota[0];
      return defaultUserDiskQuota;
    }

    return personalDiskQuota;
  },
};
