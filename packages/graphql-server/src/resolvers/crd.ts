import { Context } from './interface';
import { toRelay, paginate, extractPagination, filter } from './utils';
import CustomResource, { Item } from '../crdClient/customResource';
import pluralize from 'pluralize';
import { isEmpty, omit, mapValues, find, get, isNil } from 'lodash';
import KeycloakAdminClient from 'keycloak-admin';
import { ApolloError } from 'apollo-server';
const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
import {createConfig} from '../config';
import { CrdCache } from '../cache/crdCache';
import * as logger from '../logger';
import WorkspaceApi from '../workspace/api';
import CurrentWorkspace, { createInResolver } from '../workspace/currentWorkspace';
import { defaultWorkspaceId, keycloakMaxCount } from './constant';
import { parseResourceRole, ResourceNamePrefix, ResourceRole } from './resourceRole';

// utils
const config = createConfig();

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
  private customUpdate?: ({
    name, metadata, spec, customResource, context, getPrefix, data, currentWorkspace
  }: {
    name: string,
    metadata: any,
    spec: any,
    customResource: any,
    context: Context,
    getPrefix: () => string,
    data: any,
    currentWorkspace: CurrentWorkspace
  }) => Promise<any>;
  private customParseWhere?: (where: any) => any;
  private generateName?: () => string;
  private rolePrefix?: string;
  private preCreateCheck?: (data: any) => Promise<any>;

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
    customUpdate,
    customParseWhere,
    generateName,
    preCreateCheck
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
    customUpdate?: ({
      name, metadata, spec, customResource, context, getPrefix, data, currentWorkspace
    }: {
      name: string,
      metadata: any,
      spec: any,
      customResource: any,
      context: Context,
      getPrefix: () => string,
      data: any,
      currentWorkspace: CurrentWorkspace
    }) => Promise<any>,
    customParseWhere?: (where: any) => any,
    generateName?: () => string,
    preCreateCheck?: (data: any) => Promise<any>,
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
    this.rolePrefix = config.rolePrefix;
    this.customParseWhere = customParseWhere;
    this.generateName = generateName;
    this.preCreateCheck = preCreateCheck;
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
        const currentWorkspace = parent.currentWorkspace;
        const groups = await this.findAllGroups(context, currentWorkspace);
        // find each role-mappings
        const groupsWithRole = await Promise.all(
          groups
          .map(async group => {
            const roles = await context.kcAdminClient.groups.listRealmRoleMappings({
              id: group.id
            });
            const findRole = roles.find(role => role.name === `${this.getPrefix(currentWorkspace)}${resourceId}`);
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

  // tslint:disable-next-line:max-line-length
  public findInGroup = async (groupId: string, resource: string, kcAdminClient: KeycloakAdminClient, currentWorkspace: CurrentWorkspace) => {
    const roles = await this.listGroupRealmRoles(kcAdminClient, groupId, currentWorkspace);
    return Boolean(find(roles, role => {
      return role.resourceName === resource;
    }));
  }

  public createOnKeycloak = async (
    data: any,
    metadata: any,
    spec: any,
    context: {
      kcAdminClient: KeycloakAdminClient,
      workspaceApi: WorkspaceApi,
      everyoneGroupId: string,
      defaultNamespace: string
    }) => {

    if (this.preCreateCheck) {
      try {
        await this.preCreateCheck({
          resource: {metadata, spec}});
      } catch (err) {
        throw err;
      }
    }

    const name = metadata.name;
    const {kcAdminClient} = context;
    // create role on keycloak
    const currentWorkspace = new CurrentWorkspace(
      context.workspaceApi, context.everyoneGroupId, false, defaultWorkspaceId, context.defaultNamespace);
    const roleName = `${this.getPrefix(currentWorkspace)}${name}`;
    await kcAdminClient.roles.create({
      name: roleName
    });
    const role = await kcAdminClient.roles.findOneByName({name: roleName});
    if (this.onCreate) {
      await this.onCreate({
        role, resource: {metadata, spec}, data, context, getPrefix: this.getPrefix, currentWorkspace});
    }
  }

  public getPrefix = (currentWorkspace: CurrentWorkspace, customizePrefix: string = '') => {
    const rolePrefix = (this.rolePrefix)
      ? `${this.rolePrefix}:${this.prefixName}:`
      : `${this.prefixName}:`;

    const workspacePrefix = currentWorkspace.checkIsDefault() ? '' : `${currentWorkspace.getWorkspaceId()}|`;
    return `${rolePrefix}${customizePrefix}${workspacePrefix}`;
  }

  /**
   * query methods
   */

  private listQuery =
    async (customResource: CustomResource<SpecType>, where: any, order: any, currentWorkspace: CurrentWorkspace) => {
    const namespace = currentWorkspace.getK8sNamespace();
    const rows = await customResource.list(namespace);
    let mappedRows = rows.map(row => this.internalPropMapping(row, currentWorkspace));
    mappedRows = filter(mappedRows, where, order);
    return mappedRows;
  }

  private parseWhere = (argsWhere: any) => {
    return this.customParseWhere && this.customParseWhere(argsWhere) || argsWhere;
  }

  private query = async (root, args, context: Context) => {
    const customResource = context.crdClient[this.customResourceMethod];
    const currentWorkspace = createInResolver(root, args, context);
    const whereWithoutWorkspaceId = omit(args.where, 'workspaceId');
    const where = this.parseWhere(whereWithoutWorkspaceId);
    let rows = await this.listQuery(customResource, where, args && args.orderBy, currentWorkspace);
    rows = rows.map(row => ({
      ...row,
      currentWorkspace
    }));
    return paginate(rows, extractPagination(args));
  }

  private connectionQuery = async (root, args, context: Context) => {
    const customResource = context.crdClient[this.customResourceMethod];
    const currentWorkspace = createInResolver(root, args, context);
    const whereWithoutWorkspaceId = omit(args.where, 'workspaceId');
    const where = this.parseWhere(whereWithoutWorkspaceId);
    let rows = await this.listQuery(customResource, where, args && args.orderBy, currentWorkspace);
    rows = rows.map(row => ({
      ...row,
      currentWorkspace
    }));
    return toRelay(rows, extractPagination(args));
  }

  private queryOne = async (root, args, context: Context) => {
    const id = args.where.id;
    const currentWorkspace = createInResolver(root, args, context);
    const customResource = context.crdClient[this.customResourceMethod];
    try {
      const row = await customResource.get(id, currentWorkspace.getK8sNamespace());
      return this.internalPropMapping(row, currentWorkspace);
    } catch (e) {
      // if http 404 error
      return null;
    }
  }

  private queryByGroup = async (parent, args, context: Context) => {
    const currentWorkspace = parent.currentWorkspace;
    const roles = await this.listGroupRealmRoles(context.kcAdminClient, parent.id, currentWorkspace);

    // todo: make this logic better
    const rows = await Promise.all(roles.map(role => {
      if (this.resourceName === 'dataset') {
        return context.getDataset(role.resourceName)
          .then(dataset => {
            // todo: deal with the complex type cast here
            return {
              roleName: role.originalName,
              ...dataset
            } as any;
          });
      }

      if (this.resourceName === 'image') {
        return context.getImage(role.resourceName);
      }

      if (this.resourceName === 'instanceType') {
        return context.getInstanceType(role.resourceName);
      }
      // return context.crdClient[this.customResourceMethod].get(name);
    }));
    return rows.map(row => this.internalPropMapping(row, currentWorkspace));
  }

  /**
   * Mutations
   */

  private create = async (root, args, context: Context) => {
    const name = (this.generateName) ? this.generateName() : get(args, 'data.name');
    const {kcAdminClient, crdClient} = context;
    const customResource = crdClient[this.customResourceMethod];
    const currentWorkspace = createInResolver(root, args, context);
    const {metadata, spec} = this.createMapping(args.data, name);

    if (this.preCreateCheck) {
      try {
        await this.preCreateCheck({
          resource: {metadata, spec}});
      } catch (err) {
        throw err;
      }
    }

    // create role on keycloak
    const roleName = `${this.getPrefix(currentWorkspace)}${name}`;
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
    const res = await customResource.create(metadata, spec, currentWorkspace.getK8sNamespace());
    if (this.onCreate) {
      const onCreateGetPrefix = (customizePrefix?: string) => this.getPrefix(currentWorkspace, customizePrefix);
      await this.onCreate({
        role, resource: res, data: args.data, context, getPrefix: onCreateGetPrefix, currentWorkspace});
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

    return this.internalPropMapping(res, currentWorkspace);
  }

  private update = async (root, args, context: Context) => {
    const name = args.where.id;
    const {kcAdminClient, crdClient} = context;
    const customResource = crdClient[this.customResourceMethod];
    const currentWorkspace = createInResolver(root, args, context);
    const roleName = `${this.getPrefix(currentWorkspace)}${name}`;
    const role = await kcAdminClient.roles.findOneByName({name: roleName});

    // update crd on k8s
    const onUpdateGetPrefix = (customizePrefix?: string) => this.getPrefix(currentWorkspace, customizePrefix);
    const {metadata, spec} = this.updateMapping(args.data);
    const res = (this.customUpdate) ?
    await this.customUpdate({
      name, metadata, spec, customResource, context, getPrefix: onUpdateGetPrefix, data: args.data, currentWorkspace
    }) :
    await customResource.patch(name, {
      metadata: omit(metadata, 'name'),
      spec
    }, currentWorkspace.getK8sNamespace());

    if (this.onUpdate) {
      await this.onUpdate({
        role, resource: res, data: args.data, context, getPrefix: onUpdateGetPrefix, currentWorkspace});
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
    return this.internalPropMapping(res, currentWorkspace);
  }

  private destroy = async (root, args, context: Context) => {
    const name = args.where.id;
    const {kcAdminClient, crdClient} = context;
    const currentWorkspace = createInResolver(root, args, context);
    const onDestroyGetPrefix = (customizePrefix?: string) => this.getPrefix(currentWorkspace, customizePrefix);
    const customResource = crdClient[this.customResourceMethod];
    const roleName = `${this.getPrefix(currentWorkspace)}${name}`;
    const role = await kcAdminClient.roles.delByName({name: roleName});

    // delete crd on k8s
    const crd = await customResource.get(name, currentWorkspace.getK8sNamespace());
    await customResource.del(name, currentWorkspace.getK8sNamespace());
    if (this.onDelete) {
      await this.onDelete({name, context, resource: crd, getPrefix: onDestroyGetPrefix, currentWorkspace});
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
    return this.internalPropMapping(crd, currentWorkspace);
  }

  // tslint:disable-next-line:max-line-length
  private findAllGroups = async (context: Context, currentWorkspace: CurrentWorkspace) => {
    const {kcAdminClient, workspaceApi} = context;
    let groups = (currentWorkspace.checkIsDefault()) ?
      await kcAdminClient.groups.find({
        max: keycloakMaxCount
      }) :
      await workspaceApi.listGroups(currentWorkspace.getWorkspaceId());
    const everyoneGroupId = context.everyoneGroupId;
    // filter out everyone
    groups = groups.filter(group => group.id !== everyoneGroupId);
    // filter workspace groups
    groups = groups.filter(group => !group.attributes || !group.attributes.isWorkspace);
    return groups;
  }

  private internalPropMapping = (row: any, currentWorkspace: CurrentWorkspace) => {
    return {
      ...this.propMapping(row),
      currentWorkspace
    };
  }

  private listGroupRealmRoles = async (
    kcAdminClient: KeycloakAdminClient,
    groupId: string,
    currentWorkspace: CurrentWorkspace
  ): Promise<ResourceRole[]> => {
      const groupRoles = await kcAdminClient.groups.listRealmRoleMappings({
        id: groupId
      });

      let roles = groupRoles.map(role => parseResourceRole(role.name));
      roles = roles.filter(role =>
          role.resourcePrefix === this.prefixName &&
          currentWorkspace.getWorkspaceId() === role.workspaceId);

      // if rolePrefix not exist, filter only roles without rolePrefix
      // else, filter only roles with rolePrefix
      return this.rolePrefix ?
        roles.filter(role => role.rolePrefix === this.rolePrefix) :
        roles.filter(role => isNil(role.rolePrefix));
  }
}
