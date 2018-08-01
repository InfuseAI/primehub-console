import KcAdminClient from 'keycloak-admin';
import { toRelay, getFromAttr, mutateRelation } from './utils';
import CrdClient from '../crdClient/crdClientImpl';
import { mapValues, find, pick, first } from 'lodash';
import { unflatten } from 'flat';
import { EVERYONE_GROUP_ID } from './constant';
import { crd as instanceTypeResolver } from './instanceType';
import { crd as datasetResolver } from './dataset';
import { crd as imageResolver } from './image';
import { Context } from './interface';
import { Attributes, FieldType } from './attr';

/**
 * Mutation
 */

export const create = async (root, args, context: Context) => {
  const kcAdminClient = context.kcAdminClient;

  // create resource
  // displayName, canUseGpu, gpuQuota, diskQuota in attributes
  const payload = args.data;
  const attrs = new Attributes({
    data: pick(payload, ['displayName', 'canUseGpu', 'gpuQuota', 'diskQuota'])
  });

  await kcAdminClient.groups.create({
    name: payload.name,
    attributes: attrs.toKeycloakAttrs()
  });

  // find the group
  const groups = await kcAdminClient.groups.find({search: payload.name});
  const group = first(groups);

  // add users
  try {
    await mutateRelation({
      resource: payload.users,
      connect: async where => {
        // add user to group
        await kcAdminClient.users.addToGroup({
          id: where.id,
          groupId: group.id
        });
      }
    });
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
  }

  return group;
};

export const update = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;

  // update resource
  const payload = args.data;
  const group = await kcAdminClient.groups.findOne({
    id: groupId
  });

  // merge attrs
  // displayName, canUseGpu, gpuQuota, diskQuota in attributes
  const attrs = new Attributes({
    keycloakAttr: group.attributes,
    schema: {
      displayName: {type: FieldType.string},
      canUseGpu: {type: FieldType.boolean},
      gpuQuota: {type: FieldType.float},
      diskQuota: {type: FieldType.string}
    }
  });
  attrs.mergeWithData(pick(payload, ['displayName', 'canUseGpu', 'gpuQuota', 'diskQuota']));

  // update
  await kcAdminClient.groups.update({id: groupId}, {
    name: payload.name,
    attributes: attrs.toKeycloakAttrs()
  });

  // connect to users
  try {
    await mutateRelation({
      resource: payload.users,
      connect: async where => {
        // add user to group
        await kcAdminClient.users.addToGroup({
          id: where.id,
          groupId: group.id
        });
      },
      disconnect: async where => {
        // add user to group
        await kcAdminClient.users.delFromGroup({
          id: where.id,
          groupId: group.id
        });
      }
    });
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
  }

  return group;
};

export const destroy = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const group = await kcAdminClient.groups.findOne({
    id: groupId
  });
  await kcAdminClient.groups.del({
    id: groupId
  });
  return group;
};

/**
 * Query
 */

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

  users: async (parent, args, context: Context) => {
    try {
      return await context.kcAdminClient.groups.listMembers({
        id: parent.id
      });
    } catch (err) {
      return [];
    }
  },

  ...instanceTypeResolver.resolveInGroup(),
  ...datasetResolver.resolveInGroup(),
  ...imageResolver.resolveInGroup()
};
