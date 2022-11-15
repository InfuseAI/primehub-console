import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import {
  toRelay,
  mutateRelation,
  parseDiskQuota,
  stringifyDiskQuota,
  splitByComma,
  joinByComma,
  serializeEnvs,
  deserializeEnvs,
  parseMemory,
  stringifyMemory,
  filter,
  paginate,
  extractPagination,
  findGroupByName,
  getFromAttr} from './utils';
import { pick, isNil, get, isEmpty, find } from 'lodash';
import { crd as instanceTypeResolver } from './instanceType';
import { crd as datasetResolver } from './dataset';
import { crd as imageResolver } from './image';
import * as resourceStatusResolver from './resourceStatus';
import { Context } from './interface';
import { Attributes, FieldType } from './attr';
import { keycloakMaxCount } from './constant';
import { ApolloError } from 'apollo-server';
import * as logger from '../logger';
import Boom from 'boom';
import {createConfig} from '../config';
import { transform } from './groupUtils';
import { isGroupNameAvailable } from '../utils/groupCheck';
import { isUserAdmin } from './user';
import { PhApplication } from './phApplication';

type GroupDeletionCallback = (
  context: Context,
  group: {
    id: string;
    name: string;
  },
  dryrun: boolean
) => Promise<number>;

const deletionCallacks: {
  [key: string]: GroupDeletionCallback;
} = {};

export const registerGroupDeletionCallback = (
  key: string,
  callback: GroupDeletionCallback
) => {
  deletionCallacks[key] = callback;
};

const deleteAllGroupResources = async (
  context: Context,
  group: {
    id: string;
    name: string;
  },
  dryrun: boolean
) => {
  const promises = Object.entries(deletionCallacks).map(
    async ([key, callback]) => ({
      [key]: await callback(context, group, dryrun),
    })
  );

  const results = await Promise.all(promises);
  return Object.assign({}, ...results);
};

const config = createConfig();

const EXCEED_QUOTA_ERROR = 'EXCEED_QUOTA';
const NOT_AUTH_ERROR = 'NOT_AUTH';

// constants
const attrSchema = {
  displayName: {type: FieldType.string},
  quotaCpu: {type: FieldType.float, rename: 'quota-cpu'},
  quotaGpu: {type: FieldType.integer, rename: 'quota-gpu'},
  quotaMemory: {serialize: stringifyMemory, deserialize: parseMemory, rename: 'quota-memory'},
  userVolumeCapacity: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota, rename: 'user-volume-capacity'},
  projectQuotaCpu: {type: FieldType.float, rename: 'project-quota-cpu'},
  projectQuotaGpu: {type: FieldType.integer, rename: 'project-quota-gpu'},
  projectQuotaMemory: {serialize: stringifyMemory, deserialize: parseMemory, rename: 'project-quota-memory'},
  // shared volume
  enabledSharedVolume: {type: FieldType.boolean, rename: 'enabled-shared-volume'},
  sharedVolumeCapacity: {serialize: stringifyDiskQuota, deserialize: parseDiskQuota, rename: 'shared-volume-capacity'},
  homeSymlink: {type: FieldType.boolean, rename: 'home-symlink'},
  launchGroupOnly: {type: FieldType.boolean, rename: 'launch-group-only'},
  enabledDeployment: {type: FieldType.boolean, rename: 'enabled-deployment'},
  maxDeploy: {type: FieldType.integer, rename: 'max-deploy'},
  deploymentsUsage: { type: FieldType.integer },
  jobDefaultActiveDeadlineSeconds: {type: FieldType.integer, rename: 'job-default-active-deadline-seconds'},
  // group admin
  admins: {serialize: splitByComma, deserialize: joinByComma},
  trackingUri: {type: FieldType.string, rename: 'mlflow-tracking-uri'},
  uiUrl: {type: FieldType.string, rename: 'mlflow-ui-url'},
  trackingEnvs: {serialize: serializeEnvs, deserialize: deserializeEnvs, rename: 'mlflow-tracking-envs'},
  artifactEnvs: {serialize: serializeEnvs, deserialize: deserializeEnvs, rename: 'mlflow-artifact-envs'},
};

const groupAttrs = Object.keys(attrSchema);

// utils
const validateSharedVolumeAttrs = (attrs: Attributes) => {
  const {enabledSharedVolume, sharedVolumeCapacity} = attrs.getData();

  // if a group has sharedVolumeCapacity = null + enabledSharedVolume, it should raise an error.
  if (enabledSharedVolume && isNil(sharedVolumeCapacity)) {
    throw Boom.badData('sharedVolumeCapacity should not be null');
  }
};

/**
 * Mutation
 */

const isGroupAdmin = async (groupId: string, context: Context) => {
  const group = await context.kcAdminClient.groups.findOne({id: groupId});
  const admins = group && group.attributes && group.attributes.admins || [];
  return (admins.indexOf(context.username) >= 0);
};

export const create = async (root, args, context: Context) => {
  const kcAdminClient = context.kcAdminClient;

  // create resource
  // displayName, canUseGpu, quotaGpu in attributes
  const payload = args.data;
  if (payload.enabledSharedVolume && isNil(payload.launchGroupOnly)) {
    payload.launchGroupOnly = true;
  }

  const attrs = new Attributes({
    data: {
      ...pick(payload, groupAttrs),
      // set homeSymlink to true if enabledSharedVolume
      homeSymlink: payload.enabledSharedVolume ? true : undefined
    },
    schema: attrSchema
  });

  validateSharedVolumeAttrs(attrs);

  if (config.primehubMode === 'deploy') {
    // enable model deployment in 'deploy' mode automatically
    attrs.mergeWithData({
      enabledDeployment: true
    });
  }

  const groups = await kcAdminClient.groups.find();

  // check license
  checkLicenseGroupQuota(groups);

  // check existing groups with the same name
  if (!isGroupNameAvailable(payload.name, groups)) {
    throw new ApolloError('Group exists with same name', 'GROUP_CONFLICT_NAME');
  }

  let groupId: string;
  try {
      const response = await kcAdminClient.groups.create({
        name: payload.name,
        attributes: attrs.toKeycloakAttrs()
      });
      groupId = response.id;
  } catch (err) {
    if (!err.response || err.response.status !== 409) {
      throw err;
    }
    throw new ApolloError('Group exists with same name', 'GROUP_CONFLICT_NAME');
  }

  // find the group
  const group = await kcAdminClient.groups.findOne({
    id: groupId
  });

  // create pvc
  if (payload.enabledSharedVolume && payload.sharedVolumeCapacity >= 0) {
    await context.k8sGroupPvc.create({
      groupName: group.name,
      volumeSize: payload.sharedVolumeCapacity
    });
  }

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
    logger.error({
      component: logger.components.group,
      type: 'CREATE_USER_RELATION_MUTATION',
      stacktrace: e.stack,
      message: e.message
    });
  }

  logger.info({
    component: logger.components.group,
    type: 'CREATE',
    userId: context.userId,
    username: context.username,
    id: group.id
  });

  return transform(group);
};

export const update = async (root, args, context: Context) => {
  const {realm, userId, kcAdminClient} = context;
  const groupId = args.where.id;
  // only system admin and group admin can update group
  const mutable = await isUserAdmin(realm, userId, kcAdminClient) ? true : await isGroupAdmin(groupId, context);
  if (!mutable) {
    throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  }

  // update resource
  const payload = args.data;
  const group = await kcAdminClient.groups.findOne({
    id: groupId
  });

  // merge attrs
  // displayName, canUseGpu, quotaGpu in attributes
  const attrs = new Attributes({
    keycloakAttr: group.attributes,
    schema: attrSchema
  });

  const data = pick(payload, groupAttrs);
  // set homeSymlink to true if enabledSharedVolume
  // if enabledSharedVolume not specified, do not update the homeSymlink field
  if (payload.enabledSharedVolume) {
    data.homeSymlink = true;
  }

  // launch group only default value is true
  if (
    payload.enabledSharedVolume &&
    !attrs.getData().enabledSharedVolume &&
    isNil(payload.launchGroupOnly)
  ) {
    data.launchGroupOnly = true;
  }

  attrs.mergeWithData(data);

  // validate if a group has sharedVolumeCapacity = null + enabledSharedVolume, it should raise an error.
  validateSharedVolumeAttrs(attrs);
  // create pvc
  if (payload.enabledSharedVolume && payload.sharedVolumeCapacity >= 0) {
    const pvc = await context.k8sGroupPvc.findOne(group.name);
    if (pvc === null) {
      await context.k8sGroupPvc.create({
        groupName: group.name,
        volumeSize: payload.sharedVolumeCapacity
      });
    }
  }

  // update
  try {
    await kcAdminClient.groups.update({id: groupId}, {
      attributes: attrs.toKeycloakAttrs()
    });
  } catch (err) {
    if (!err.response || err.response.status !== 409) {
      throw err;
    }
    throw new ApolloError('Group exists with same name', 'GROUP_CONFLICT_NAME');
  }

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
    logger.error({
      component: logger.components.watcher,
      type: 'UPDATE_USER_RELATION_MUTATION',
      stacktrace: e.stack,
      message: e.message
    });
  }

  logger.info({
    component: logger.components.group,
    type: 'UPDATE',
    userId: context.userId,
    username: context.username,
    id: group.id
  });

  return transform(group);
};

export const onPhAppDeleted = async (context: Context, phApplication: PhApplication) => {
  const {kcAdminClient} = context;

  // update resource
  const group = await findGroupByName(phApplication.groupName, kcAdminClient);

  // merge attrs
  // displayName, canUseGpu, quotaGpu in attributes
  const attrs = new Attributes({
    keycloakAttr: group.attributes,
    schema: attrSchema
  });
  const mlflowTrackingUri = getFromAttr('mlflow-tracking-uri', group.attributes, null);
  const svcEndpoints = phApplication?.svcEndpoints || [];

  if (!mlflowTrackingUri) {
    return;
  }

  if (!find(svcEndpoints, svcEndpoint => mlflowTrackingUri.startsWith(`http://${svcEndpoint}`))) {
    return;
  }

  const data = {
    trackingUri: null,
    uiUrl: null,
    trackingEnvs: [],
    artifactEnvs: [],
  };
  attrs.mergeWithData(data);
  // update
  try {
    await kcAdminClient.groups.update({id: group.id}, {
      attributes: attrs.toKeycloakAttrs()
    });
  } catch (err) {
    if (!err.response || err.response.status !== 409) {
      throw err;
    }
    throw new ApolloError('Group reset mlflow settings failed', 'GROUP_UNKNOWN_ERROR');
  }

  logger.info({
    component: logger.components.group,
    type: 'RESET_MLFLOW_SETTING',
    userId: context.userId,
    username: context.username,
    id: group.id
  });
};

export const destroy = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const group = await kcAdminClient.groups.findOne({
    id: groupId,
  });

  // Delete the group
  await kcAdminClient.groups.del({
    id: groupId,
  });

  // Delete the shared volume of this group
  await context.k8sGroupPvc.delete(group.name);

  // Delete resources in this group
  const transformedGroup = transform(group);
  deleteAllGroupResources(context, transformedGroup, false)
    .then(result => {
      logger.info({
        component: logger.components.group,
        type: 'DELETE_GROUP_RESOURCES',
        userId: context.userId,
        username: context.username,
        id: group.id,
        name: group.name,
        groupResourcesDeleted: result,
      });
    })
    .catch(err => {
      logger.info({
        component: logger.components.group,
        type: 'DELETE_GROUP_RESOURCES_FAILED',
        userId: context.userId,
        username: context.username,
        id: group.id,
        name: group.name,
        message: err.message,
        stack: err.stack,
      });
    });

  logger.info({
    component: logger.components.group,
    type: 'DELETE',
    userId: context.userId,
    username: context.username,
    id: group.id,
    name: group.name,
  });

  return transformedGroup;
};

export const groupResourcesToBeDeleted = async (
  root,
  args,
  context: Context
) => {
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const group = await kcAdminClient.groups.findOne({
    id: groupId,
  });

  const transformedGroup = transform(group);
  return deleteAllGroupResources(context, transformedGroup, true);
};

/**
 * Query
 */

const quotaComparator = (fieldName: string) => (group: any) => {
  const fieldValue = group[fieldName];
  if (isNil(fieldValue)) {
    return Number.POSITIVE_INFINITY;
  }
  return fieldValue;
};

const customComparators: Record<string, (group: any) => number> = {
  quotaCpu: quotaComparator('quotaCpu'),
  quotaGpu: quotaComparator('quotaGpu'),
  projectQuotaCpu: quotaComparator('projectQuotaCpu'),
  projectQuotaGpu: quotaComparator('projectQuotaGpu'),
};

const listQuery = async (
  kcAdminClient: KeycloakAdminClient,
  where: any,
  order: any,
  context: Context
): Promise<{fetched: boolean, groups: any[]}> => {
  const idWhere = get(where, 'id');
  if (idWhere) {
    const group = await kcAdminClient.groups.findOne({id: idWhere});
    return group ? {
      fetched: true,
      groups: [transform(group)]
     } : {
       fetched: false,
       groups: [],
     };
  }

  let groups = await kcAdminClient.groups.find({ max: keycloakMaxCount });

  const everyoneGroupId = context.everyoneGroupId;
  // filter out everyone
  groups = groups.filter(group => group.id !== everyoneGroupId);

  // do not need to sort, so we do pagination first and then map
  const searchFields = ['name', 'displayName'];
  if (isEmpty(order) && isEmpty(where?.search)) {
    groups = filter(groups, {where, order, searchFields});
    return {
      fetched: false,
      groups,
    };
  } else {
    // need to sort, we fetch all groups first
    const fetchedGroups = await Promise.all(
      groups.map(group => context.kcAdminClient.groups.findOne({id: group.id})));
    const transformed = fetchedGroups.map(transform);
    groups = filter(transformed, {where, order, searchFields, comparators: customComparators});
    return {
      fetched: true,
      groups,
    };
  }
};

export const query = async (root, args, context: Context) => {
  const groupQuery =
    await listQuery(context.kcAdminClient, args && args.where, args && args.orderBy, context);

  // if not fetched, we paginate first then map
  let fetchedAndPagedGroups;
  if (!groupQuery.fetched) {
    const pageGroups = paginate(groupQuery.groups, extractPagination(args));
    fetchedAndPagedGroups = await Promise.all(
      pageGroups.map(group => context.kcAdminClient.groups.findOne({id: group.id})));
    fetchedAndPagedGroups = fetchedAndPagedGroups.map(transform);
  } else {
    // map already, just paginate
    fetchedAndPagedGroups = paginate(groupQuery.groups, extractPagination(args)).map(transform);
  }

  return fetchedAndPagedGroups;
};

export const connectionQuery = async (root, args, context: Context) => {
  const groupQuery =
    await listQuery(context.kcAdminClient, args && args.where, args && args.orderBy, context);

  const relayResponse = toRelay(groupQuery.groups, extractPagination(args));
  relayResponse.edges = await Promise.all(relayResponse.edges.map(
    async edge => {
      // if fetched, we dont fetch again
      const fetchedNode = groupQuery.fetched ?
        edge.node
        : transform(await context.kcAdminClient.groups.findOne({id: edge.node.id}));

      return {
        cursor: edge.cursor,
        node: fetchedNode
      };
    })
  );

  return relayResponse;
};

export const queryOne = async (root, args, context: Context) => {
  const groupId = args.where.id;
  const kcAdminClient = context.kcAdminClient;
  const group = await kcAdminClient.groups.findOne({id: groupId});
  return group ? transform(group) : null;
};

export const typeResolvers = {
  users: async (parent, args, context: Context) => {
    try {
      return context.kcAdminClient.groups.listMembers({
        id: parent.id,
        // the keycloak default maximum results size is 100,
        // it's broken our GroupUser relation picker (wrong state if a group picked over 100 members)
        max: 9999
      });
    } catch (err) {
      return [];
    }
  },
  resourceStatus: resourceStatusResolver.query,
  ...instanceTypeResolver.resolveInGroup(),
  ...datasetResolver.resolveInGroup(),
  ...imageResolver.resolveInGroup()
};

function checkLicenseGroupQuota(groups) {
  const maxGroup = createConfig().maxGroup;
  if (maxGroup >= 0) {
    // max group validation need minus everyone group.
    const groupCount = groups.length - 1;
    if (groupCount >= maxGroup) {
      throw new ApolloError(
        'Number of groups exceeds license limitation',
        EXCEED_QUOTA_ERROR
      );
    }
  }
}
