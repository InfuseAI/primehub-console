import { Context } from './interface';
import { Item } from '../crdClient/customResourceNG';
import { AnnouncementSpec } from '../crdClient/crdClientImpl';
import { mutateRelation } from './utils';
import { Crd } from './crd';
import { isUndefined, isNil, get } from 'lodash';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import moment from 'moment';

const generateName = () => {
  return `ann-${Math.random().toString(36).substring(2, 15)}`;
};

export const mapping = (item: Item<AnnouncementSpec>) => {
  return {
    id: item.metadata.name,
    content: {html: item.spec.content},
    expiryDate: moment.unix(item.spec.expiryDate).utc().toISOString(),
    sendEmail: Boolean(item.spec.sendEmail),
    status: item.spec.status,
    spec: item.spec
  };
};

export const resolveType = {
  async global(parent, args, context: Context) {
    const {kcAdminClient, everyoneGroupId} = context;
    // find in everyOne group
    return this.findInGroup(everyoneGroupId, parent.id, kcAdminClient);
  }
};

export const onCreate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
  const everyoneGroupId = context.everyoneGroupId;
  if (data && data.global) {
    // assign role to everyone
    await context.kcAdminClient.groups.addRealmRoleMappings({
      id: everyoneGroupId,
      roles: [{
        id: role.id,
        name: role.name
      }]
    });
  }

  if (data && data.groups) {
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async where => {
        await context.kcAdminClient.groups.addRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      }
    });
  }
};

export const onUpdate = async (
  {role, resource, data, context}:
  {role: RoleRepresentation, resource: any, data: any, context: Context}) => {
  const everyoneGroupId = context.everyoneGroupId;
  if (data && !isUndefined(data.global)) {
    if (data.global) {
      // assign role to everyone
      await context.kcAdminClient.groups.addRealmRoleMappings({
        id: everyoneGroupId,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    } else {
      await context.kcAdminClient.groups.delRealmRoleMappings({
        id: everyoneGroupId,
        roles: [{
          id: role.id,
          name: role.name
        }]
      });
    }
  }

  if (data && data.groups) {
    // add to group
    await mutateRelation({
      resource: data.groups,
      connect: async where => {
        await context.kcAdminClient.groups.addRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      },
      disconnect: async where => {
        await context.kcAdminClient.groups.delRealmRoleMappings({
          id: where.id,
          roles: [{
            id: role.id,
            name: role.name
          }]
        });
      }
    });
  }
};

export const createMapping = (data: any, name: string) => {
  return {
    metadata: {
      name
    },
    spec: {
      content: get(data, 'content.html', `<p></p>`),
      expiryDate: isNil(data.expiryDate) ? moment.utc().unix() : moment.utc(data.expiryDate).unix(),
      sendEmail: isNil(data.sendEmail) ? undefined : Boolean(data.sendEmail),
      status: isNil(data.status) ? 'draft' : data.status
    }
  };
};

export const updateMapping = (data: any) => {
  return {
    spec: {
      content: isNil(get(data, 'content.html')) ? undefined : get(data, 'content.html'),
      expiryDate: isNil(data.expiryDate) ? undefined : moment.utc(data.expiryDate).unix(),
      sendEmail: isNil(data.sendEmail) ? undefined : Boolean(data.sendEmail),
      status: isNil(data.status) ? undefined : data.status
    }
  };
};

const customParseWhere = (where: any) => {
  if (!where) {
    return where;
  }
  if (where.expiryDate_gt) {
    where.expiryDate_gt = moment.utc(where.expiryDate_gt).unix();
  }

  if (where.expiryDate_lt) {
    where.expiryDate_lt = moment.utc(where.expiryDate_lt).unix();
  }
  return where;
};

export const crd = new Crd<AnnouncementSpec>({
  customResourceMethod: 'announcements',
  propMapping: mapping,
  resolveType,
  prefixName: 'ann',
  resourceName: 'announcement',
  createMapping,
  updateMapping,
  onCreate,
  onUpdate,
  generateName
});
