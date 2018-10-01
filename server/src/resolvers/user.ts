import KcAdminClient from 'keycloak-admin';
import { pick, omit, find, isUndefined, first, sortBy, get } from 'lodash';
import {
  toRelay, toAttr, mutateRelation, parseDiskQuota, stringifyDiskQuota, filter, paginate, extractPagination
} from './utils';
import { detaultSystemSettings, keycloakMaxCount } from './constant';
import { Attributes, FieldType } from './attr';
import { Context } from './interface';
import { ApolloError } from 'apollo-server';
import { RequiredActionAlias } from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';

/**
 * utils
 */

const TWELVE_HOURS = 43200;

export const assignAdmin = async (userId: string, realm: string, kcAdminClient: KcAdminClient) => {
  if (realm === 'master') {
    // add admin role to user
    const role = await kcAdminClient.roles.findOneByName({
      name: 'admin'
    });
    await kcAdminClient.users.addRealmRoleMappings({
      id: userId,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  } else {
    // if realm is not master
    // add client role-mappings: realm-management/realm-admin
    const clients = await kcAdminClient.clients.find();
    const realmManagementClient = clients.find(client => client.clientId === 'realm-management');
    if (!realmManagementClient) {
      return;
    }
    const role = await kcAdminClient.clients.findRole({
      id: realmManagementClient.id,
      roleName: 'realm-admin'
    });
    await kcAdminClient.users.addClientRoleMappings({
      id: userId,
      clientUniqueId: realmManagementClient.id,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  }
};

const deassignAdmin = async (userId: string, realm: string, kcAdminClient: KcAdminClient) => {
  if (realm === 'master') {
    // add admin role to user
    const role = await kcAdminClient.roles.findOneByName({
      name: 'admin'
    });
    await kcAdminClient.users.delRealmRoleMappings({
      id: userId,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  } else {
    // if realm is not master
    // add client role-mappings: realm-management/realm-admin
    const clients = await kcAdminClient.clients.find();
    const realmManagementClient = clients.find(client => client.clientId === 'realm-management');
    if (!realmManagementClient) {
      return;
    }
    const role = await kcAdminClient.clients.findRole({
      id: realmManagementClient.id,
      roleName: 'realm-admin'
    });
    await kcAdminClient.users.delClientRoleMappings({
      id: userId,
      clientUniqueId: realmManagementClient.id,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  }
};

/**
 * Query
 */

const listQuery = async (kcAdminClient: KcAdminClient, where: any) => {
  let users = await kcAdminClient.users.find({
    max: keycloakMaxCount
  });
  users = sortBy(users, 'createdTimestamp');
  users = filter(users, where);
  return users;
};

export const query = async (root, args, context: Context) => {
  const users = await listQuery(context.kcAdminClient, args && args.where);
  return paginate(users, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const users = await listQuery(context.kcAdminClient, args && args.where);
  return toRelay(users, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const userId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  try {
    const user = await kcAdminClient.users.findOne({id: userId});
    return user;
  } catch (e) {
    return null;
  }
};

/**
 * Mutation
 */

export const create = async (root, args, context: Context) => {
  const kcAdminClient = context.kcAdminClient;

  // create resource
  // totp, createdTimestamp will be ignored
  // isAdmin, groups will be handled later
  const payload = args.data;
  const attrs = new Attributes({
    data: {
      personalDiskQuota: payload.personalDiskQuota
    },
    schema: {
      personalDiskQuota: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota}
    }
  });

  try {
    await kcAdminClient.users.create({
      username: payload.username,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      // force enabled to true
      enabled: true,
      attributes: attrs.toKeycloakAttrs()
    });
  } catch (err) {
    if (!err.response || err.response.status !== 409) {
      throw err;
    }
    // 409 error, check it's email or username
    const message = get(err, 'response.data.errorMessage');

    if (message.indexOf('username') >= 0) {
      throw new ApolloError(message, 'USER_CONFLICT_USERNAME');
    }

    if (message.indexOf('email') >= 0) {
      throw new ApolloError(message, 'USER_CONFLICT_EMAIL');
    }
    throw err;
  }

  // find the user
  const users = await kcAdminClient.users.find({
    username: payload.username
  });
  const user = first(users);

  // send email
  if (payload.sendEmail && user.email) {
    kcAdminClient.users.executeActionsEmail({
      id: user.id,
      lifespan: TWELVE_HOURS,
      actions: [RequiredActionAlias.VERIFY_EMAIL]
    })
    .then(() => {
      // tslint:disable-next-line:no-console
      console.log(`send activation email to ${user.email}`);
    })
    .catch(err => {
      // tslint:disable-next-line:no-console
      console.log(`fail to send activation email to ${user.email}`);
      // tslint:disable-next-line:no-console
      console.log(err);
    });
  }

  // set admin
  if (payload.isAdmin) {
    try {
      await assignAdmin(user.id, context.realm, kcAdminClient);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.log(e);
    }
  }

  // connect to groups
  try {
    await mutateRelation({
      resource: payload.groups,
      connect: async where => {
        // add user to group
        await kcAdminClient.users.addToGroup({
          id: user.id,
          groupId: where.id
        });
      }
    });
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
  }

  return user;
};

export const update = async (root, args, context: Context) => {
  const userId = args.where.id;
  const kcAdminClient = context.kcAdminClient;

  // update resource
  const payload = args.data;
  // createdTimestamp will be ignored
  // isAdmin, totp, groups will be handled later
  const user = await kcAdminClient.users.findOne({
    id: userId
  });

  // merge attrs
  const attrs = new Attributes({
    keycloakAttr: user.attributes,
    schema: {
      personalDiskQuota: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota}
    }
  });
  attrs.mergeWithData({
    personalDiskQuota: payload.personalDiskQuota
  });

  // update
  try {
    await kcAdminClient.users.update({id: userId}, {
      username: payload.username,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      enabled: isUndefined(payload.enabled) ? true : payload.enabled,
      attributes: attrs.toKeycloakAttrs()
    });
  } catch (err) {
    if (!err.response || err.response.status !== 409) {
      throw err;
    }
    throw new ApolloError('User exists with same email', 'USER_CONFLICT_EMAIL');
  }

  // set admin
  if (!isUndefined(payload.isAdmin)) {
    try {
      if (payload.isAdmin) {
        await assignAdmin(user.id, context.realm, kcAdminClient);
      } else {
        await deassignAdmin(user.id, context.realm, kcAdminClient);
      }
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.log(e);
    }
  }

  // disable totp
  if (!isUndefined(payload.totp) && payload.totp === false) {
    try {
      await kcAdminClient.users.removeTotp({
        id: userId
      });
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.log(e);
    }
  }

  // connect to groups
  try {
    await mutateRelation({
      resource: payload.groups,
      connect: async where => {
        // add user to group
        await kcAdminClient.users.addToGroup({
          id: user.id,
          groupId: where.id
        });
      },
      disconnect: async where => {
        // remove user from group
        await kcAdminClient.users.delFromGroup({
          id: user.id,
          groupId: where.id
        });
      }
    });
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
  }

  return user;
};

export const destroy = async (root, args, context: Context) => {
  const userId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const user = await kcAdminClient.users.findOne({
    id: userId
  });
  await kcAdminClient.users.del({
    id: userId
  });
  return user;
};

/**
 * Mutation
 */

export const sendEmail = async (root, args, context: Context) => {
  const {id, resetActions, expiresIn}: {id: string, resetActions: any[], expiresIn: number} = args;
  const user = await context.kcAdminClient.users.findOne({id});
  if (!user.email) {
    throw new ApolloError('user email not defined', 'USER_EMAIL_NOT_EXIST');
  }
  await context.kcAdminClient.users.executeActionsEmail({
    id,
    lifespan: expiresIn,
    actions: resetActions
  });
  return {id};
};

export const resetPassword = async (root, args, context: Context) => {
  const {id, password, temporary}: {id: string, password: string, temporary: boolean} = args;
  await context.kcAdminClient.users.resetPassword({
    id,
    credential: {
      type: 'password',
      temporary,
      value: password
    }
  });
  return {id};
};

/**
 * Type
 */

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
      const realmManagementClient = clients.find(client => client.clientId === 'realm-management');

      if (!realmManagementClient) {
        return false;
      }

      const clientRoles = await kcAdminClient.users.listClientRoleMappings({
        id: userId,
        clientUniqueId: realmManagementClient.id
      });
      return Boolean(find(clientRoles, role => role.name === 'realm-admin'));
    }
  },

  personalDiskQuota: async (parent, args, context: Context) => {
    const everyoneGroupId = context.everyoneGroupId;
    const personalDiskQuota =
      parent.attributes && parent.attributes.personalDiskQuota && parent.attributes.personalDiskQuota[0];

    // get defaultUserDiskQuota from system
    if (!personalDiskQuota) {
      const {attributes} = await context.kcAdminClient.groups.findOne({id: everyoneGroupId});
      const defaultUserDiskQuota =
        attributes && attributes.defaultUserDiskQuota && attributes.defaultUserDiskQuota[0];
      return parseDiskQuota(defaultUserDiskQuota || detaultSystemSettings.defaultUserDiskQuota);
    }

    return parseDiskQuota(personalDiskQuota);
  },

  groups: async (parent, args, context: Context) => {
    try {
      const groups = await context.kcAdminClient.users.listGroups({
        id: parent.id
      });
      return Promise.all(groups.map(async group => {
        return context.kcAdminClient.groups.findOne({id: group.id});
      }));
    } catch (err) {
      return [];
    }
  }
};
