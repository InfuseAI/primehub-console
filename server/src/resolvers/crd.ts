import { toRelay, paginate, extractPagination, findResourceInGroup } from './utils';
import CustomResource, { Item } from '../crdClient/customResource';
import pluralize from 'pluralize';
import { isEmpty } from 'lodash';
const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);

export class Crd<SpecType> {
  private customResourceMethod: string;
  private propMapping: (item: Item<SpecType>) => Record<string, any>;
  private resolveType?: Record<string, any>;
  private prefixName: string;
  private resourceName: string;

  constructor({
    customResourceMethod,
    propMapping,
    resolveType,
    prefixName,
    resourceName
  }: {
    customResourceMethod: string,
    propMapping: (item: Item<SpecType>) => Record<string, any>,
    resolveType?: Record<string, any>,
    prefixName: string,
    resourceName: string
  }) {
    this.customResourceMethod = customResourceMethod;
    this.propMapping = propMapping;
    this.resolveType = resolveType;
    this.prefixName = prefixName;
    this.resourceName = resourceName;
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
    if (isEmpty(this.resolveType)) {
      return {};
    }

    return {
      [typename]: this.resolveType
    };
  }

  public resolveInGroup = () => {
    const pluralKey = pluralize.plural(this.resourceName);
    return {
      [pluralKey]: this.queryByGroup
    };
  }

  /**
   * query methods
   */

  private listQuery = async (customResource: CustomResource<SpecType>) => {
    const rows = await customResource.list();
    return rows.map(this.propMapping);
  }

  private query = async (root, args, context: any) => {
    const customResource = context.crdClient[this.customResourceMethod];
    const rows = await this.listQuery(customResource);
    return paginate(rows, extractPagination(args));
  }

  private connectionQuery = async (root, args, context: any) => {
    const customResource = context.crdClient[this.customResourceMethod];
    const rows = await this.listQuery(customResource);
    return toRelay(rows, extractPagination(args));
  }

  private queryOne = async (root, args, context: any) => {
    const id = args.where.id;
    const customResource = context.crdClient[this.customResourceMethod];
    const row = await customResource.get(id);
    return this.propMapping(row);
  }

  private queryByGroup = async (parent, args, context: any) => {
    let roles = await context.kcAdminClient.groups.listRealmRoleMappings({
      id: parent.id
    });
    const prefix = this.getPrefix();
    roles = roles.filter(role => role.name.startsWith(prefix));
    const names = roles.map(role => role.name.slice(prefix.length));
    const rows = await Promise.all(names.map(name => {
      return context.crdClient[this.customResourceMethod].get(name);
    }));
    return rows.map(this.propMapping);
  }

  private getPrefix() {
    return `${this.prefixName}:`;
  }
}
