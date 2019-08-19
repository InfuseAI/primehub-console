import { Context } from './interface';
import { toRelay, paginate, extractPagination, filter } from './utils';
import CustomResource, { Item } from '../crdClient/customResource';
import pluralize from 'pluralize';
import { isEmpty, omit, mapValues, find, get } from 'lodash';
import KeycloakAdminClient from 'keycloak-admin';
import { ApolloError } from 'apollo-server';
const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
import {createConfig} from '../config';
import { CrdCache } from '../cache/crdCache';
const config = createConfig();
import * as logger from '../logger';
import WorkspaceApi from '../workspace/api';
import { defaultWorkspaceId, keycloakMaxCount } from './constant';

export class Crd<SpecType> {
  private cache: CrdCache<SpecType>;
  private customResourceMethod: string;
  private propMapping: (item: Item<SpecType>) => Record<string, any>;
  private createMapping: (data: any, name: string) => any;
  private updateMapping: (data: any) => any;
  private resolveType?: Record<string, any>;
  private prefixName: string;
  private resourceName: string;
  private onCreate?: (data: any) => Promise<any>;
  private onUpdate?: (data: any) => Promise<any>;
  private onDelete?: (data: any) => Promise<any>;
  private customParseNameFromRole?: (roleName: string) => string;
  private customUpdate?: ({
    name, metadata, spec, customResource, context, getPrefix, data
  }: {
    name: string, metadata: any, spec: any, customResource: any, context: Context, getPrefix: () => string, data: any
  }) => Promise<any>;
  private customParseWhere?: (where: any) => any;
  private generateName?: () => string;
  private rolePrefix?: string;

  constructor({
    customResourceMethod,
    propMapping,
    createMapping,
    updateMapping,
    resolveType,
    prefixName,
    resourceName,
    onCreate,
    onUpdate,
    onDelete,
    customParseNameFromRole,
    customUpdate,
    customParseWhere,
    generateName
  }: {
    customResourceMethod: string,
    propMapping: (item: Item<SpecType>) => Record<string, any>,
    createMapping: (data: any, name: string) => any,
    updateMapping: (data: any) => any,
    resolveType?: Record<string, any>,
    prefixName: string,
    resourceName: string,
    onCreate?: (data: any) => Promise<any>,
    onUpdate?: (data: any) => Promise<any>,
    onDelete?: (data: any) => Promise<any>,
    customParseNameFromRole?: (roleName: string) => string,
    customUpdate?: ({
      name, metadata, spec, customResource, context, getPrefix, data
    }: {
      name: string, metadata: any, spec: any, customResource: any, context: Context, getPrefix: () => string, data: any
    }) => Promise<any>,
    customParseWhere?: (where: any) => any,
    generateName?: () => string,
  }) {
    this.customResourceMethod = customResourceMethod;
    this.propMapping = propMapping;
    this.createMapping = createMapping;
    this.updateMapping = updateMapping;
    this.resolveType = resolveType;
    this.prefixName = prefixName;
    this.resourceName = resourceName;
    this.onCreate = onCreate;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;
    this.customUpdate = customUpdate;
    this.customParseNameFromRole = customParseNameFromRole;
    this.rolePrefix = config.rolePrefix;
    this.customParseWhere = customParseWhere;
    this.generateName = generateName;
  }

  public setCache(cache: CrdCache<SpecType>) {
    this.cache = cache;
  }

  /**
   * resolvers
   */

  public resolvers = () => {
    const pluralKey = pluralize.plural(this.resourceName);
    return {
      [this.resourceName]: this.queryOne,
      [pluralKey]: this.query,
      [`${pluralKey}Connection`]: this.connectionQuery
    };
  }

  public typeResolver = () => {
    const typename = capitalizeFirstLetter(this.resourceName);
    const defaultType = {
      groups: async (parent, args, context: Context) => {
        const resourceId = parent.id;
        // find all groups
        const workspaceId = (!args.where.workspaceId || args.where.workspaceId === defaultWorkspaceId)
          ? null
          : args.where.workspaceId;
        const groups = await this.findAllGroups(context, workspaceId);
        // find each role-mappings
        const groupsWithRole = await Promise.all(
          groups
          .map(async group => {
            const roles = await context.kcAdminClient.groups.listRealmRoleMappings({
              id: group.id
            });
            const findRole = roles.find(role => role.name === `${this.getPrefix(workspaceId)}${resourceId}`);
            return findRole
              ? context.kcAdminClient.groups.findOne({id: group.id})
              : null;
          })
        );
        // filter out
        return groupsWithRole.filter(v => v);
      }
    };

    if (isEmpty(this.resolveType)) {
      return {[typename]: defaultType};
    }

    this.resolveType = mapValues(this.resolveType, resolver => resolver.bind(this));

    return {
      [typename]: {...defaultType, ...this.resolveType}
    };
  }

  public resolveInGroup = () => {
    const pluralKey = pluralize.plural(this.resourceName);
    return {
      [pluralKey]: this.queryByGroup
    };
  }

  public resolveInMutation = () => {
    const typename = capitalizeFirstLetter(this.resourceName);
    return {
      [`create${typename}`]: this.create,
      [`update${typename}`]: this.update,
      [`delete${typename}`]: this.destroy
    };
  }

  public parseNameFromRole = (roleName: string, workspaceId: string) => {
    return this.customParseNameFromRole
      ? this.customParseNameFromRole(roleName)
      : roleName.slice(this.getPrefix(workspaceId).length);
  }

  // tslint:disable-next-line:max-line-length
  public findInGroup = async (groupId: string, resource: string, kcAdminClient: KeycloakAdminClient, workspaceId: string) => {
    const roles = await kcAdminClient.groups.listRealmRoleMappings({
      id: groupId
    });
    return Boolean(find(roles, role => {
      const resourceNameFromRole = this.parseNameFromRole(role.name, workspaceId);
      return resourceNameFromRole === resource;
    }));
  }

  public createOnKeycloak = async (data: any, metadata: any, spec: any, context: any) => {
    const name = metadata.name;
    const {kcAdminClient} = context;
    // create role on keycloak
    const roleName = `${this.getPrefix(null)}${name}`;
    await kcAdminClient.roles.create({
      name: roleName
    });
    const role = await kcAdminClient.roles.findOneByName({name: roleName});
    if (this.onCreate) {
      await this.onCreate({role, resource: {metadata, spec}, data, context, getPrefix: this.getPrefix});
    }
  }

  public getPrefix = (workspaceId: string) => {
    const rolePrefix = (this.rolePrefix)
      ? `${this.rolePrefix}:${this.prefixName}:`
      : `${this.prefixName}:`;

    const workspacePrefix = workspaceId ? `${workspaceId}|` : '';
    return `${rolePrefix}${workspacePrefix}`;
  }

  /**
   * query methods
   */

  private listQuery = async (customResource: CustomResource<SpecType>, where: any, workspaceId: string) => {
    const rows = await customResource.list(workspaceId);
    let mappedRows = rows.map(this.propMapping);
    mappedRows = filter(mappedRows, where);
    return mappedRows;
  }

  private parseWhere = (argsWhere: any) => {
    return this.customParseWhere && this.customParseWhere(argsWhere) || argsWhere;
  }

  private query = async (root, args, context: Context) => {
    const customResource = context.crdClient[this.customResourceMethod];
    const workspaceId = (!args.where.workspaceId || args.where.workspaceId === defaultWorkspaceId)
      ? null
      : args.where.workspaceId;
    const whereWithoutWorkspaceId = omit(args.where, 'workspaceId');
    const where = this.parseWhere(whereWithoutWorkspaceId);
    const rows = await this.listQuery(customResource, where, workspaceId);
    return paginate(rows, extractPagination(args));
  }

  private connectionQuery = async (root, args, context: Context) => {
    const customResource = context.crdClient[this.customResourceMethod];
    const workspaceId = (!args.where.workspaceId || args.where.workspaceId === defaultWorkspaceId)
      ? null
      : args.where.workspaceId;
    const whereWithoutWorkspaceId = omit(args.where, 'workspaceId');
    const where = this.parseWhere(whereWithoutWorkspaceId);
    const rows = await this.listQuery(customResource, where, workspaceId);
    return toRelay(rows, extractPagination(args));
  }

  private queryOne = async (root, args, context: Context) => {
    const id = args.where.id;
    const workspaceId = (!args.where.workspaceId || args.where.workspaceId === defaultWorkspaceId)
      ? null
      : args.where.workspaceId;
    const customResource = context.crdClient[this.customResourceMethod];
    try {
      const row = await customResource.get(id, workspaceId);
      return this.propMapping(row);
    } catch (e) {
      // if http 404 error
      return null;
    }
  }

  private queryByGroup = async (parent, args, context: Context) => {
    let roles = await context.kcAdminClient.groups.listRealmRoleMappings({
      id: parent.id
    });
    const workspaceId = (!args.where.workspaceId || args.where.workspaceId === defaultWorkspaceId)
      ? null
      : args.where.workspaceId;
    const prefix = this.getPrefix(workspaceId);
    roles = roles.filter(role => role.name.startsWith(prefix));
    const namesWithRole = roles.map(role => {
      return {name: this.parseNameFromRole(role.name, workspaceId), roleName: role.name};
    });

    // todo: make this logic better
    const rows = await Promise.all(namesWithRole.map(({name, roleName}) => {
      if (this.resourceName === 'dataset') {
        return context.getDataset(name)
          .then(dataset => {
            // todo: deal with the complex type cast here
            return {
              roleName,
              ...dataset
            } as any;
          });
      }

      if (this.resourceName === 'image') {
        return context.getImage(name);
      }

      if (this.resourceName === 'instanceType') {
        return context.getInstanceType(name);
      }
      // return context.crdClient[this.customResourceMethod].get(name);
    }));
    return rows.map(this.propMapping);
  }

  /**
   * Mutations
   */

  private create = async (root, args, context: Context) => {
    const name = (this.generateName) ? this.generateName() : get(args, 'data.name');
    const {kcAdminClient, crdClient} = context;
    const customResource = crdClient[this.customResourceMethod];
    const workspaceId = (!args.data.workspaceId || args.data.workspaceId === defaultWorkspaceId)
      ? null
      : args.data.workspaceId;
    // create role on keycloak
    const roleName = `${this.getPrefix(workspaceId)}${name}`;
    try {
      await kcAdminClient.roles.create({
        name: roleName
      });
    } catch (err) {
      if (err.response && err.response.status === 409) {
        throw new ApolloError(`Resource already exist`,
          'RESOURCE_CONFLICT'
        );
      }
      throw err;
    }

    const role = await kcAdminClient.roles.findOneByName({name: roleName});

    // create crd on k8s
    const {metadata, spec} = this.createMapping(args.data, name);
    const res = await customResource.create(metadata, spec);
    if (this.onCreate) {
      await this.onCreate({role, resource: res, data: args.data, context, getPrefix: this.getPrefix});
    }
    // clear cache
    if (this.cache) {
      this.cache.clear();
    }

    logger.info({
      component: logger.components[this.resourceName],
      type: 'CREATE',
      userId: context.userId,
      username: context.username,
      id: res.metadata.name
    });

    return this.propMapping(res);
  }

  private update = async (root, args, context: Context) => {
    const name = args.where.id;
    const {kcAdminClient, crdClient} = context;
    const customResource = crdClient[this.customResourceMethod];
    const roleName = `${this.getPrefix()}${name}`;
    const role = await kcAdminClient.roles.findOneByName({name: roleName});

    // update crd on k8s
    const {metadata, spec} = this.updateMapping(args.data);
    const res = (this.customUpdate) ?
    await this.customUpdate({
      name, metadata, spec, customResource, context, getPrefix: this.getPrefix, data: args.data
    }) :
    await customResource.patch(name, {
      metadata: omit(metadata, 'name'),
      spec
    });

    if (this.onUpdate) {
      await this.onUpdate({role, resource: res, data: args.data, context, getPrefix: this.getPrefix});
    }
    // clear cache
    if (this.cache) {
      this.cache.clear();
    }

    logger.info({
      component: logger.components[this.resourceName],
      type: 'UPDATE',
      userId: context.userId,
      username: context.username,
      id: res.metadata.name
    });
    return this.propMapping(res);
  }

  private destroy = async (root, args, context: Context) => {
    const name = args.where.id;
    const {kcAdminClient, crdClient} = context;
    const customResource = crdClient[this.customResourceMethod];
    const roleName = `${this.getPrefix()}${name}`;
    const role = await kcAdminClient.roles.delByName({name: roleName});

    // delete crd on k8s
    const crd = await customResource.get(name);
    await customResource.del(name);
    if (this.onDelete) {
      await this.onDelete({name, context, getPrefix: this.getPrefix});
    }
    // clear cache
    if (this.cache) {
      this.cache.clear();
    }

    logger.info({
      component: logger.components[this.resourceName],
      type: 'DELETE',
      userId: context.userId,
      username: context.username,
      id: name
    });
    return this.propMapping(crd);
  }

  // tslint:disable-next-line:max-line-length
  private findAllGroups = async (context: Context, workspaceId?: string) => {
    const {kcAdminClient, workspaceApi} = context;
    let groups = (!workspaceId || workspaceId === defaultWorkspaceId) ?
      await kcAdminClient.groups.find({
        max: keycloakMaxCount
      }) :
      await workspaceApi.listGroups(workspaceId);
    const everyoneGroupId = context.everyoneGroupId;
    // filter out everyone
    groups = groups.filter(group => group.id !== everyoneGroupId);
    // filter workspace groups
    groups = groups.filter(group => !group.attributes.isWorkspace);
    return groups;
  }
}
