import { Context } from './interface';
import { QueryImageMode, toRelay, paginate, extractPagination, filter } from './utils';
import CustomResource, { Item } from '../crdClient/customResource';
import pluralize from 'pluralize';
import { isEmpty, omit, mapValues, remove, find, get, isNil, unionBy } from 'lodash';
import KeycloakAdminClient from 'keycloak-admin';
import { ApolloError } from 'apollo-server';
const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
import {createConfig} from '../config';
import { CrdCache } from '../cache/crdCache';
import * as logger from '../logger';
import { parseResourceRole, ResourceRole } from './resourceRole';
import { transform as transformGroup } from './groupUtils';
import { keycloakMaxCount } from './constant';

// utils
const config = createConfig();

export class Crd<SpecType> {
  private cache: CrdCache<SpecType>;
  private customResourceMethod: string;
  private propMapping: (item: Item<SpecType>) => Record<string, any>;
  private createMapping: (data: any, name: string, context: Context) => any;
  private updateMapping: (data: any) => any;
  private resolveType?: Record<string, any>;
  private prefixName: string;
  private resourceName: string;
  private beforeCreate?: (data: any) => Promise<any>;
  private onCreate?: (data: any) => Promise<any>;
  private beforeUpdate?: (data: any) => Promise<any>;
  private onUpdate?: (data: any) => Promise<any>;
  private beforeDelete?: (data: any) => Promise<any>;
  private onDelete?: (data: any) => Promise<any>;
  private customUpdate?: ({
    name, metadata, spec, customResource, context, getPrefix, data
  }: {
    name: string,
    metadata: any,
    spec: any,
    customResource: any,
    context: Context,
    getPrefix: () => string,
    data: any
  }) => Promise<any>;
  private customParseWhere?: (where: any) => any;
  private generateName?: () => string;
  private rolePrefix?: string;
  private preCreateCheck?: (data: any) => Promise<any>;
  private customResolvers?: () => any;
  private customResolversInGroup?: () => any;
  private customResolversInMutation?: () => any;

  constructor({
    customResourceMethod,
    propMapping,
    createMapping,
    updateMapping,
    resolveType,
    prefixName,
    resourceName,
    beforeCreate,
    beforeDelete,
    beforeUpdate,
    onCreate,
    onUpdate,
    onDelete,
    customUpdate,
    customParseWhere,
    generateName,
    preCreateCheck,
    customResolvers,
    customResolversInGroup,
    customResolversInMutation
  }: {
    customResourceMethod: string,
    propMapping: (item: Item<SpecType>) => Record<string, any>,
    createMapping: (data: any, name: string, context: Context) => any,
    updateMapping: (data: any) => any,
    resolveType?: Record<string, any>,
    prefixName: string,
    resourceName: string,
    beforeCreate?: (data: any) => Promise<any>,
    beforeUpdate?: (data: any) => Promise<any>,
    beforeDelete?: (data: any) => Promise<any>,
    onCreate?: (data: any) => Promise<any>,
    onUpdate?: (data: any) => Promise<any>,
    onDelete?: (data: any) => Promise<any>,
    customUpdate?: ({
      name, metadata, spec, customResource, context, getPrefix, data
    }: {
      name: string,
      metadata: any,
      spec: any,
      customResource: any,
      context: Context,
      getPrefix: () => string,
      data: any
    }) => Promise<any>,
    customParseWhere?: (where: any) => any,
    generateName?: () => string,
    preCreateCheck?: (data: any) => Promise<any>,
    customResolvers?: () => any,
    customResolversInGroup?: () => any,
    customResolversInMutation?: () => any,
  }) {
    this.customResourceMethod = customResourceMethod;
    this.propMapping = propMapping;
    this.createMapping = createMapping;
    this.updateMapping = updateMapping;
    this.resolveType = resolveType;
    this.prefixName = prefixName;
    this.resourceName = resourceName;
    this.beforeCreate = beforeCreate;
    this.beforeUpdate = beforeUpdate;
    this.beforeDelete = beforeDelete;
    this.onCreate = onCreate;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;
    this.customUpdate = customUpdate;
    this.rolePrefix = config.rolePrefix;
    this.customParseWhere = customParseWhere;
    this.generateName = generateName;
    this.preCreateCheck = preCreateCheck;
    this.customResolvers = customResolvers || (() => undefined);
    this.customResolversInGroup = customResolversInGroup || (() => undefined);
    this.customResolversInMutation = customResolversInMutation || (() => undefined);
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
      [`${pluralKey}Connection`]: this.connectionQuery,
      ...this.customResolvers()
    };
  }

  public typeResolver = () => {
    const typename = capitalizeFirstLetter(this.resourceName);
    const defaultType = {
      groups: async (parent, args, context: Context) => {
        const resourceId = parent.id;
        // find all groups
        const groups = await this.findAllGroups(context);
        // find each role-mappings
        const groupsWithRole = await Promise.all(
          groups
          .map(async group => {
            const roles = await context.kcAdminClient.groups.listRealmRoleMappings({
              id: group.id
            });
            const findRole = roles.find(role => role.name === `${this.getPrefix()}${resourceId}`);
            return findRole
              ? transformGroup(await context.kcAdminClient.groups.findOne({id: group.id}))
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
      [pluralKey]: this.queryByGroup,
      ...this.customResolversInGroup()
    };
  }

  public resolveInMutation = () => {
    const typename = capitalizeFirstLetter(this.resourceName);
    return {
      [`create${typename}`]: this.create,
      [`update${typename}`]: this.update,
      [`delete${typename}`]: this.destroy,
      ...this.customResolversInMutation()
    };
  }

  // tslint:disable-next-line:max-line-length
  public findInGroup = async (groupId: string, resource: string, kcAdminClient: KeycloakAdminClient) => {
    const roles = await this.listGroupResourceRoles(kcAdminClient, groupId);
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
      everyoneGroupId: string,
      defaultNamespace: string
    }) => {

    if (this.beforeCreate) {
      try {
        await this.beforeCreate({data, context});
      } catch (err) {
        throw err;
      }
    }

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
    const roleName = `${this.getPrefix()}${name}`;
    await kcAdminClient.roles.create({
      name: roleName
    });
    const role = await kcAdminClient.roles.findOneByName({name: roleName});
    if (this.onCreate) {
      await this.onCreate({
        role, resource: {metadata, spec}, data, context, getPrefix: this.getPrefix});
    }
  }

  public getPrefix = (customizePrefix: string = '') => {
    const rolePrefix = (this.rolePrefix)
      ? `${this.rolePrefix}:${this.prefixName}:`
      : `${this.prefixName}:`;

    return `${rolePrefix}${customizePrefix}`;
  }

  /**
   * query methods
   */

  private listQuery =
    async (customResource: CustomResource<SpecType>, where: any, order: any, mode?: QueryImageMode) => {
    const rows = await customResource.list();
    let mappedRows = rows.map(row => this.propMapping(row));
    if (this.customResourceMethod === 'images') {
        if (mode === QueryImageMode.SYSTEM_ONLY) {
          mappedRows = mappedRows.filter(row => {
            return isEmpty(row.groupName);
          });
        } else if (mode === QueryImageMode.GROUP_ONLY) {
          mappedRows = mappedRows.filter(row => {
            return !isEmpty(row.groupName);
          });
        }
    }
    mappedRows = filter(mappedRows, where, order);
    return mappedRows;
  }

  private parseWhere = (argsWhere: any) => {
    return this.customParseWhere && this.customParseWhere(argsWhere) || argsWhere;
  }

  private query = async (root, args, context: Context) => {
    const customResource = context.crdClient[this.customResourceMethod];
    const where = this.parseWhere(args.where);
    const rows = await this.listQuery(customResource, where, args && args.orderBy);

    return paginate(rows, extractPagination(args));
  }

  private connectionQuery = async (root, args, context: Context) => {
    const customResource = context.crdClient[this.customResourceMethod];
    const {mode = QueryImageMode.ALL} = args;
    const where = this.parseWhere(args.where);
    const rows = await this.listQuery(customResource, where, args && args.orderBy, mode);

    return toRelay(rows, extractPagination(args));
  }

  private queryOne = async (root, args, context: Context) => {
    const id = args.where.id;
    const customResource = context.crdClient[this.customResourceMethod];
    try {
      const row = await customResource.get(id);
      return this.propMapping(row);
    } catch (e) {
      // if http 404 error
      return null;
    }
  }

  private queryByGroup = async (parent, args, context: Context) => {
    const groupId = parent.id;

    let resourceRoles = await this.listGroupResourceRoles(context.kcAdminClient, groupId);
    if (!parent.effectiveGroup) {
      return this.queryResourcesByRoles(resourceRoles, context, args);
    }

    // Effective Roles, we need to merge resource in this group and the everyone group.
    const resourceRolesEveryone = this.transfromResourceRoles(parent.realmRolesEveryone);

    if (this.resourceName !== 'dataset')  {
      resourceRoles = unionBy(resourceRoles, resourceRolesEveryone, resourceRole => resourceRole.originalName);
      return this.queryResourcesByRoles(resourceRoles, context, args);
    }

    // For datasets in effectiveGroups, we need to merge datasets with non-launch-group datasets
    const datasetsMap = {};

    // dataset in this group
    let datasets =
    await this.queryResourcesByRoles(resourceRoles, context);
    datasets.forEach(dataset => {
      datasetsMap[dataset.id] = dataset;
    });

    // dataset in everyone group
    datasets = await this.queryResourcesByRoles(resourceRolesEveryone, context);
    datasets.forEach(dataset => {
      if (datasetsMap[dataset.id]) {
        if (dataset.writable) {
          datasetsMap[dataset.id] = dataset;
        }
      } else {
        datasetsMap[dataset.id] = dataset;
      }
    });

    // dataset in other groups. but launchGroupOnly = false
    const resourceRolesUser = this.transfromResourceRoles(parent.realmRolesUser);
    datasets = await this.queryResourcesByRoles(resourceRolesUser, context);
    datasets.forEach(dataset => {
      if (dataset.launchGroupOnly) {
        return;
      }
      if (datasetsMap[dataset.id]) {
        if (dataset.writable) {
          datasetsMap[dataset.id] = dataset;
        }
      } else {
        datasetsMap[dataset.id] = dataset;
      }
    });

    return Object.values(datasetsMap);
  }

  /**
   * Mutations
   */

  private create = async (root, args, context: Context) => {
    const name = (this.generateName) ? this.generateName() : get(args, 'data.name');
    const {kcAdminClient, crdClient} = context;
    const customResource = crdClient[this.customResourceMethod];
    const {metadata, spec} = this.createMapping(args.data, name, context);

    if (this.beforeCreate) {
      try {
        await this.beforeCreate({data: args.data, context});
      } catch (err) {
        throw err;
      }
    }

    if (this.preCreateCheck) {
      try {
        await this.preCreateCheck({
          resource: {metadata, spec}});
      } catch (err) {
        throw err;
      }
    }

    // create role on keycloak
    const roleName = `${this.getPrefix()}${name}`;
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
    const res = await customResource.create(metadata, spec);
    if (this.onCreate) {
      const onCreateGetPrefix = (customizePrefix?: string) => this.getPrefix(customizePrefix);
      await this.onCreate({
        role, resource: res, data: args.data, context, getPrefix: onCreateGetPrefix});
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

    if (this.beforeUpdate) {
      try {
        await this.beforeUpdate({data: args.data, context});
      } catch (err) {
        throw err;
      }
    }

    // update crd on k8s
    const onUpdateGetPrefix = (customizePrefix?: string) => this.getPrefix(customizePrefix);
    const {metadata, spec} = this.updateMapping(args.data);
    const res = (this.customUpdate) ?
    await this.customUpdate({
      name, metadata, spec, customResource, context, getPrefix: onUpdateGetPrefix, data: args.data
    }) :
    await customResource.patch(name, {
      metadata: omit(metadata, 'name'),
      spec
    });

    if (this.onUpdate) {
      await this.onUpdate({
        role, resource: res, data: args.data, context, getPrefix: onUpdateGetPrefix });
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
    const onDestroyGetPrefix = (customizePrefix?: string) => this.getPrefix(customizePrefix);
    const customResource = crdClient[this.customResourceMethod];
    const roleName = `${this.getPrefix()}${name}`;
    const crd = await customResource.get(name);

    // delete crd on k8s
    if (this.beforeDelete) {
      try {
        await this.beforeDelete({data: crd, context});
      } catch (err) {
        throw err;
      }
    }

    await kcAdminClient.roles.delByName({name: roleName});
    await customResource.del(name);
    if (this.onDelete) {
      await this.onDelete({name, context, resource: crd, getPrefix: onDestroyGetPrefix});
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
  private findAllGroups = async (context: Context) => {
    const {kcAdminClient} = context;
    let groups = await kcAdminClient.groups.find({ max: keycloakMaxCount });
    const everyoneGroupId = context.everyoneGroupId;
    // filter out everyone
    groups = groups.filter(group => group.id !== everyoneGroupId);

    return groups;
  }

  private listGroupResourceRoles = async (
    kcAdminClient: KeycloakAdminClient,
    groupId: string
  ): Promise<ResourceRole[]> => {
    const groupRoles = await kcAdminClient.groups.listRealmRoleMappings({
      id: groupId
    });

    return this.transfromResourceRoles(groupRoles);
  }

  private transfromResourceRoles(realmRoles: any[]) {
    let resourceRoles = realmRoles.map(role => parseResourceRole(role.name));
    resourceRoles = resourceRoles.filter(role =>
      role.resourcePrefix === this.prefixName);
    // if rolePrefix not exist, filter only roles without rolePrefix
    // else, filter only roles with rolePrefix
    return this.rolePrefix ?
      resourceRoles.filter(role => role.rolePrefix === this.rolePrefix) :
      resourceRoles.filter(role => isNil(role.rolePrefix));
  }

  private async queryResourcesByRoles(
    resourceRoles: ResourceRole[],
    context: Context,
    args?: {
      mode: QueryImageMode
  }) {
    // map the resource roles to resources
    // todo: make this logic better

    let rows = await Promise.all(resourceRoles.map(role => {
      const onError = () => {
        logger.error({
          type: 'FAIL_QUERY_RESOURCE_FROM_K8S_API',
          resource: this.resourceName,
          name: role.resourceName,
        });

        return null;
      };

      if (this.resourceName === 'dataset') {
        return context.getDataset(role.resourceName)
          .then(dataset => {
            // todo: deal with the complex type cast here
            return {
              roleName: role.originalName,
              ...dataset
            } as any;
          }).catch(onError);
      }
      if (this.resourceName === 'image') {
        return context.getImage(role.resourceName).then(image => {
          const {mode = QueryImageMode.ALL} = args;
          const isGroupImage: boolean = image.spec && image.spec.groupName && image.spec.groupName.length > 0;

          if (mode === QueryImageMode.SYSTEM_ONLY && isGroupImage) {
            return null;
          }
          if (mode === QueryImageMode.GROUP_ONLY && !isGroupImage) {
            return null;
          }

          return {...image};
        }).catch(onError);
      }
      if (this.resourceName === 'instanceType') {
        return context.getInstanceType(role.resourceName).catch(onError);
      }
      // return context.crdClient[this.customResourceMethod].get(name);
    }));
    rows = rows
    .filter(row => row !== null)  // filter out the failed resource
    .map(row => this.propMapping(row));
    return rows;
  }
}
