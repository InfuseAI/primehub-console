import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import {
  find,
  isUndefined,
  first,
  get,
  every,
  isEmpty,
  reduce,
  uniq,
  flatten,
  isNaN,
  isNil,
} from 'lodash';
import {
  mutateRelation, parseBoolean, parseDiskQuota, stringifyDiskQuota
} from './utils';
import { Attributes, FieldType } from './attr';
import { Context } from './interface';
import { ApolloError } from 'apollo-server';
import { RequiredActionAlias } from '@keycloak/keycloak-admin-client/lib/defs/requiredActionProviderRepresentation';
import BPromise from 'bluebird';
import * as logger from '../logger';
import { crd as annCrdResolver } from '../resolvers/announcement';
import moment from 'moment';
import { transform as transformGroup } from './groupUtils';
import { ErrorCodes } from '../errorCodes';
import { createConfig } from '../config';

/**
 * utils
 */

const TWENTYFOUR_HOURS = 86400;

export const assignAdmin = async (userId: string, realm: string, kcAdminClient: KeycloakAdminClient) => {
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

const deassignAdmin = async (userId: string, realm: string, kcAdminClient: KeycloakAdminClient) => {
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

const emptyResponse = {
  edges: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  }
};

const listQuery = async (kcAdminClient: KeycloakAdminClient, args: any): Promise<{
  edges: any[],
  pageInfo: {
    hasNextPage: boolean,
    hasPreviousPage: boolean,
    startCursor: string | null,
    endCursor: string | null,
    currentPage?: number | null,
    totalPage?: number | null
  }
}> => {
  const specifiedId = get(args, 'where.id');
  const usernameContains = get(args, 'where.username_contains');
  const emailContains = get(args, 'where.email_contains');
  const search = get(args, 'where.search');
  let limit = parseInt(get(args, 'first') || get(args, 'last'), 10);
  if (isNaN(limit) || isNil(limit)) {
    // default limit to 10
    limit = 10;
  }
  let page = parseInt(get(args, 'after') || get(args, 'before'), 10);
  if (get(args, 'page') >= 0) {
    page = get(args, 'page') - 1;
  }

  // if front-end try to fetch users with limit=0
  if (limit === 0) {
    return emptyResponse;
  }

  // if id specified
  if (specifiedId) {
    try {
      const user = await kcAdminClient.users.findOne({id: specifiedId});
      return {
        edges: [{
          node: user,
          cursor: user.id,
        }],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: user.id,
          endCursor: user.id,
        }
      };
    } catch (e) {
      return emptyResponse;
    }
  }

  const fetchSize = limit + 1;
  const kcQuery: any = {
    max: fetchSize,
  };

  if (usernameContains) {
    kcQuery.username = usernameContains;
  }

  if (emailContains) {
    kcQuery.email = emailContains;
  }

  if (search) {
    kcQuery.search = search;
  }

  const pageNotSpecifiedOrZero = !page;
  if (!pageNotSpecifiedOrZero) {
    // how many items to skip
    // get one more item to see if has next page
    kcQuery.first = page * limit;
  }

  let users = await kcAdminClient.users.find(kcQuery);
  const totalUsers = await kcAdminClient.users.count();

  // see if we are at first page
  const startCursor = pageNotSpecifiedOrZero ? null : page - 1;

  // check if hasNextPage & slice data
  let hasNextPage;
  let endCursor;
  if (users.length === fetchSize) {
    users = users.slice(0, -1);
    hasNextPage = true;
    endCursor = pageNotSpecifiedOrZero ? 1 : page + 1;
  } else {
    hasNextPage = false;
    endCursor = null;
  }

  // response
  return {
    edges: users.map(row => ({
      cursor: row.id,
      node: row
    })),
    pageInfo: {
      hasNextPage,
      hasPreviousPage: startCursor !== null,
      startCursor: isNil(startCursor) ? null : startCursor.toString(),
      endCursor: isNil(endCursor) ? null : endCursor.toString(),
      currentPage: page + 1,
      totalPage: Math.ceil(totalUsers / limit)
    }
  };
};

export const query = async (root, args, context: Context) => {
  const response = await listQuery(context.kcAdminClient, args);
  return response.edges.map(edge => edge.node);
};

export const connectionQuery = async (root, args, context: Context) => {
  return listQuery(context.kcAdminClient, args);
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

export const me = async (root, args, context: Context) => {
  const userId = context.userId;
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
      volumeCapacity: payload.volumeCapacity
    },
    schema: {
      volumeCapacity: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota}
    }
  });

  await checkLicenseUserQuota(kcAdminClient);

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
    const expiresIn = get(payload, 'expiresIn', TWENTYFOUR_HOURS);
    const resetActions = get(payload, 'resetActions.set',
      [RequiredActionAlias.VERIFY_EMAIL, RequiredActionAlias.UPDATE_PASSWORD]);

    kcAdminClient.users.executeActionsEmail({
      id: user.id,
      lifespan: expiresIn,
      actions: resetActions,
    })
    .then(() => {
      logger.info({
        component: logger.components.user,
        type: 'SEND_USER_CREATION_EMAIL',
        userId: context.userId,
        username: context.username,
        sentEmail: user.email,
        realm: context.realm,
        lifespan: expiresIn,
        actions: resetActions,
      });
    })
    .catch(err => {
      logger.error({
        component: logger.components.user,
        type: 'FAIL_SEND_USER_CREATION_EMAIL',
        userId: context.userId,
        username: context.username,
        sentEmail: user.email,
        realm: context.realm,
        lifespan: expiresIn,
        actions: resetActions,
      });
    });
  }

  // set admin
  if (payload.isAdmin) {
    try {
      await assignAdmin(user.id, context.realm, kcAdminClient);
    } catch (e) {
      logger.error({
        component: logger.components.user,
        type: 'FAIL_ASSIGN_ADMIN',
        userId: context.userId,
        username: context.username,
        targetUserId: user.id,
        realm: context.realm
      });
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
    logger.error({
      component: logger.components.user,
      type: 'FAIL_CONNECT_GROUP',
      userId: context.userId,
      username: context.username,
      targetUserId: user.id,
      groups: payload.groups,
      realm: context.realm
    });
  }

  logger.info({
    component: logger.components.user,
    type: 'CREATE',
    userId: context.userId,
    username: context.username,
    id: user.id
  });

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

  if (!user) {
    throw new ApolloError('user does not exist', 'USER_NOT_EXIST');
  }

  // merge attrs
  const attrs = new Attributes({
    keycloakAttr: user.attributes,
    schema: {
      volumeCapacity: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota},
      enableInviteUsers: {type: FieldType.boolean}
    }
  });
  attrs.mergeWithData({
    volumeCapacity: payload.volumeCapacity,
    enableInviteUsers: payload.enableInviteUsers
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
      logger.error({
        component: logger.components.user,
        type: 'FAIL_ASSIGN_ADMIN',
        targetUserId: user.id,
        userId: context.userId,
        username: context.username,
        realm: context.realm
      });
    }
  }

  // disable totp
  if (!isUndefined(payload.totp) && payload.totp === false) {
    try {
      await kcAdminClient.users.removeTotp({
        id: userId
      });
    } catch (e) {
      logger.error({
        component: logger.components.user,
        type: 'FAIL_REMOVE_TOTP',
        targetUserId: user.id,
        userId: context.userId,
        username: context.username,
        realm: context.realm
      });
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
    logger.error({
      component: logger.components.user,
      type: 'FAIL_CONNECT_GROUP',
      targetUserId: user.id,
      userId: context.userId,
      username: context.username,
      groups: payload.groups,
      realm: context.realm
    });
  }

  logger.info({
    component: logger.components.user,
    type: 'UPDATE',
    userId: context.userId,
    username: context.username,
    id: user.id
  });

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

  logger.info({
    component: logger.components.user,
    type: 'DELETE',
    userId: context.userId,
    username: context.username,
    id: userId
  });

  return user;
};

/**
 * Mutation
 */

export const sendEmail = async (root, args, context: Context) => {
  const {id, in: userIds, resetActions, expiresIn}: {
    id: string, in: string[], resetActions: any[], expiresIn: number
  } = args;

  // send to one
  const user = await context.kcAdminClient.users.findOne({id});
  if (!user.email) {
    throw new ApolloError('user email not defined', 'USER_EMAIL_NOT_EXIST');
  }
  await context.kcAdminClient.users.executeActionsEmail({
    id,
    lifespan: expiresIn,
    actions: resetActions
  });

  logger.info({
    component: logger.components.user,
    type: 'SEND_EMAIL',
    userId: context.userId,
    username: context.username,
    id
  });

  return {id};
};

export const sendMultiEmail = async (root, args, context: Context) => {
  const {in: userIds, resetActions, expiresIn}: {
    in: string[], resetActions: any[], expiresIn: number
  } = args;

  // send to multi users
  const results = await BPromise.map(userIds, userId => {
    return context.kcAdminClient.users.executeActionsEmail({
      id: userId,
      lifespan: expiresIn,
      actions: resetActions
    })
    .then(() => ({userId, status: true}))
    .catch(err => {
      logger.error({
        component: logger.components.user,
        type: 'FAIL_SEND_MULTI_EMAIL',
        targetUserId: userId,
        userId: context.userId,
        username: context.username,
        realm: context.realm,
        message: get(err, 'response.data.errorMessage')
      });
      return {userId, status: false};
    });
  });
  const status = every(results, 'status');

  logger.info({
    component: logger.components.user,
    type: 'SEND_MULTI_EMAIL',
    userId: context.userId,
    username: context.username,
    status
  });
  return {
    status
  };
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

  logger.info({
    component: logger.components.user,
    type: 'RESET_PASSWORD',
    targetUserId: id,
    userId: context.userId,
    username: context.username,
    id
  });
  return {id};
};

export const revokeApiToken = async (root, args, context: Context) => {
  const id = context.userId;

  try {
    await context.kcAdminClient.users.revokeConsent({
      id,
      clientId: context.keycloakClientId
    });
  } catch (e) {
    if (e.response && e.response.status === 404) {
      // no offline token
    } else {
      logger.error({
        type: 'REVOKE_API_TOKEN_FAILED',
        id,
        clientId: context.keycloakClientId,
        error: e
      });
      throw new ApolloError('Cannot revoke API token', 'USER_REVOKE_FAILED');
    }
  }

  logger.info({
    component: logger.components.user,
    type: 'REVOKE_API_TOKEN',
    targetUserId: id
  });
  return {id};
};

/**
 * Type
 */

export const isUserAdmin = async (realm: string, userId: string, kcAdminClient: KeycloakAdminClient) => {
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
};

const queryGroupsByUser = (effectiveGroup: boolean) => {
  return async (parent, args, context: Context) => {
    try {
      const userId = parent.id;
      let realmRolesEveryone = null;
      let realmRolesUser = null;

      if (effectiveGroup) {
        realmRolesEveryone = await context.kcAdminClient.groups.listRealmRoleMappings({
          id: context.everyoneGroupId
        });
        realmRolesUser = await context.kcAdminClient.users.listCompositeRealmRoleMappings({
          id: userId
        });
      }

      const groups = await context.kcAdminClient.users.listGroups({
        id: userId
      });
      const deployments = await context.crdClient.phDeployments.list() || [];

      const fetchedGroups = await Promise.all(groups.map(async group => {
        return context.kcAdminClient.groups.findOne({id: group.id});
      }));

      return fetchedGroups
        .filter(group => {
          if (effectiveGroup) {
            return group.id !== context.everyoneGroupId;
          } else {
            return true;
          }
        })
        .map(transformGroup)
        .map(group => {
          const deploymentsUsage = deployments.filter(
            deployment =>
              deployment.spec.groupId === group.id &&
              deployment.spec.stop === false
          ).length;

          return {
            ...group,
            deploymentsUsage,
            effectiveGroup,
            realmRolesEveryone,
            realmRolesUser,
          };
        });
    } catch (err) {
      return [];
    }
  };
};

export const typeResolvers = {
  federated: (parent, args, context: Context) => {
    return !isUndefined(parent.federationLink);
  },
  isAdmin: async (parent, args, context: Context) => {
    const userId = parent.id;
    // admin is determined by user's role
    const {realm, kcAdminClient} = context;
    return isUserAdmin(realm, userId, kcAdminClient);
  },

  enableInviteUsers: async parent => {
    const enableInviteUsers =
      parent.attributes &&
      parent.attributes.enableInviteUsers &&
      parent.attributes.enableInviteUsers[0];
    return parseBoolean(enableInviteUsers);
  },

  volumeCapacity: async parent => {
    const volumeCapacity =
      parent.attributes &&
      parent.attributes.volumeCapacity &&
      parent.attributes.volumeCapacity[0];

    return parseDiskQuota(volumeCapacity);
  },

  groups: queryGroupsByUser(false),

  effectiveGroups: queryGroupsByUser(true),

  announcements: async (parent, args, context: Context) => {
    try {
      let filterTime: number;
      const now = Math.ceil(Date.now() / 1000);
      const lastReadTime = parseInt(get(parent, 'attributes.annLastReadTime.0'), 10);
      if (isNaN(lastReadTime)) {
        filterTime = now;
      } else if (now > lastReadTime) {
        filterTime = now;
      } else {
        filterTime = lastReadTime;
      }
      const groups = await context.kcAdminClient.users.listGroups({
        id: parent.id
      });
      const announcements = await context.crdClient.announcements.list();
      const filteredAnn = announcements
      .filter(item => item.spec.status === 'published' && item.spec.expiryDate >= filterTime)
      .map(item => {
        return {
          id: item.metadata.name,
          content: item.spec.content,
          expiryDate: moment.unix(item.spec.expiryDate).utc().toISOString()
        };
      });

      if (isEmpty(filteredAnn)) {
        return [];
      }

      const prefix = annCrdResolver.getPrefix();
      const annMap = reduce(filteredAnn, (result, ann) => {
        result[`${prefix}${ann.id}`] = ann;
        return result;
      }, {});

      // filter announcements in groups
      const roles = await Promise.all(groups.map(async group => {
        const groupRoles = await context.kcAdminClient.groups.listRealmRoleMappings({
          id: group.id
        });

        return groupRoles.filter(role => role.name.startsWith(prefix)).map(role => role.name);
      }));

      // unique roles
      const uniqRoles = uniq(flatten(roles));

      // map to crd
      return uniqRoles.map(roleName => annMap[roleName]).filter(v => v);
    } catch (err) {
      return [];
    }
  },

  apiTokenCount: async (parent, args, context: Context) => {
    const userId = parent.id;

    try {
      // find the client
      const clients = await context.kcAdminClient.clients.find({clientId: context.keycloakClientId});
      const client = first(clients);

      // find the offline session
      const sessions = await context.kcAdminClient.users.listOfflineSessions({
        id: userId,
        clientId: client.id,
      });

      return sessions.length;
    } catch (e) {
      logger.error({
        type: 'GET_API_TOKEN_COUNT_FAILED',
        userId,
        clientId: context.keycloakClientId,
        message: e.message,
      });
      throw new ApolloError('Cannot get API token count', 'USER_API_TOKEN_COUNT');
    }
  },
};
export async function checkLicenseUserQuota(kcAdminClient: KeycloakAdminClient) {
  const maxUser = createConfig().maxUser;
  if (maxUser >= 0) {
    const userCount = await kcAdminClient.users.count();
    if (userCount >= maxUser) {
      throw new ApolloError(
        `Number of users exceeds license limitation.`,
        ErrorCodes.EXCEED_QUOTA_ERROR
      );
    }
  }
}
