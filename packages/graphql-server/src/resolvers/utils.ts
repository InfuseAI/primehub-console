import {
  first as _first,
  last as _last,
  isUndefined,
  isEmpty,
  isNull,
  pick,
  orderBy,
  reduce,
  isArray,
  mapValues,
  isNaN,
  find,
  get,
  uniq
} from 'lodash';
import KcAdminClient from 'keycloak-admin';
import { takeWhile, takeRightWhile, take, takeRight, flow } from 'lodash/fp';
import { EOL } from 'os';
import { Context, Role } from './interface';
import { keycloakMaxCount } from './constant';
import GroupRepresentation from 'keycloak-admin/lib/defs/groupRepresentation';
const ITEMS_PER_PAGE = 10;

export enum QueryImageMode {
  SYSTEM_ONLY = 'SYSTEM_ONLY',
  GROUP_ONLY = 'GROUP_ONLY',
  ALL = 'ALL'
}

export interface Pagination {
  page?: number;
  last?: number;
  first?: number;
  before?: string;
  after?: string;
}

export const paginate = (rows: any[], pagination?: Pagination) => {
  if (!isUndefined(pagination) && !isUndefined(pagination.page)) {
    return numberedPaginate(rows, pagination).rows;
  } else {
    return cursorPaginate(rows, pagination);
  }
};

export const isAdmin = (ctx: Context): boolean => {
  return ctx.role === Role.ADMIN;
};

export const isGroupAdmin = async (username: string, groupName: string, kcAdminClient: KcAdminClient): Promise<boolean> => {
  const groups = await kcAdminClient.groups.find({max: keycloakMaxCount});
  const groupData = find(groups, ['name', groupName]);
  const group = await kcAdminClient.groups.findOne({id: get(groupData, 'id', '')});
  const admins = get(group, 'attributes.admins', []);
  return admins.includes(username);
};

// TODO: This is deprecated. Please use 'isGroupMember' in middlewares/auth.ts
export const isGroupMember = async (userId: string, groupName: string, kcAdminClient: KcAdminClient): Promise<boolean> => {
  const groups = await kcAdminClient.groups.find({max: keycloakMaxCount});
  const groupData = find(groups, ['name', groupName]);
  if (!groupData) {
    // false if group not found
    return false;
  }
  const members = await kcAdminClient.groups.listMembers({
    id: get(groupData, 'id', ''),
    max: keycloakMaxCount
  });
  const memberIds = members.map(user => user.id);
  return (memberIds.indexOf(userId) >= 0);
};

export const findGroupByName = async (groupName: string, kcAdminClient: KcAdminClient): Promise<GroupRepresentation> => {
  const groups = await kcAdminClient.groups.find({max: keycloakMaxCount});
  const groupData = find(groups, ['name', groupName]);
  const group = await kcAdminClient.groups.findOne({id: get(groupData, 'id', '')});
  return group;
};

export const numberedPaginate = (rows: any[], pagination?: Pagination) => {
  const page = (!isUndefined(pagination) && !isUndefined(pagination.page)) ? pagination.page : 1;

  if (isEmpty(rows)) {
    return {
      totalPage: 1,
      currentPage: 1,
      rows,
    };
  }

  // numbered pagination
  const size = rows.length;
  const totalPage = Math.ceil(size / ITEMS_PER_PAGE);
  const offset = (page - 1) * ITEMS_PER_PAGE;

  return {
    totalPage,
    currentPage: page,
    rows: rows.slice(offset, offset + ITEMS_PER_PAGE),
  };
};

export const cursorPaginate = (rows: any[], pagination?: Pagination) => {
  if (isEmpty(pagination)) {
    return rows;
  }

  const transforms = [];
  const { last, first, before, after } = pagination;

  if (!isUndefined(before)) {
    transforms.push(takeWhile<any>(row => row.id !== before));
  }

  if (!isUndefined(after)) {
    transforms.push(takeRightWhile<any>(row => row.id !== after));
  }

  if (!isUndefined(first)) {
    transforms.push(take(first));
  }

  if (!isUndefined(last)) {
    transforms.push(takeRight(last));
  }

  return flow(transforms)(rows);
};

export const toRelay = (rows: any[], pagination?: Pagination) => {
  if (!isUndefined(pagination) && !isUndefined(pagination.page)) {
    return toRelayWithNumbered(rows, pagination);
  } else {
    return toRelayWithCursor(rows, pagination);
  }
};

export const toRelayWithNumbered = (rows: any[], pagination?: Pagination) => {
  const pageInfo = numberedPaginate(rows, pagination);
  return {
    edges: pageInfo.rows.map(row => ({
      cursor: row.id,
      node: row,
    })),
    pageInfo: {
      totalPage: pageInfo.totalPage,
      currentPage: pageInfo.currentPage,
    },
  };
};

export const toRelayWithCursor = (rows: any[], pagination?: Pagination) => {
  if (isEmpty(pagination)) {
    return {
      edges: rows.map(row => ({
        cursor: row.id,
        node: row
      })),
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: (_first(rows) || {}).id,
        endCursor: (_last(rows) || {}).id
      }
    };
  }

  const paginatedRows = cursorPaginate(rows, pagination);

  return {
    edges: paginatedRows.map(row => ({
      cursor: row.id,
      node: row
    })),
    pageInfo: {
      hasNextPage: isEmpty(rows)
        ? false
        : !isEmpty(takeRightWhile<any>(row => row.id !== (_last(rows) as any).id)(paginatedRows)),
      hasPreviousPage: isEmpty(rows)
        ? false
        : !isEmpty(takeWhile<any>(row => row.id !== (_first(rows) as any).id)(paginatedRows)),
      startCursor: (_first(paginatedRows) || {} as any).id,
      endCursor: (_last(paginatedRows) || {} as any).id
    }
  };
};

interface FilterOptions {
  where?: any;
  order?: any;
  comparators?: Record<string, (row: any) => number>;
  searchFields?: any[];
}

export const filter = (rows: any[], options: FilterOptions = {}) => {
  const {
    where, order, comparators, searchFields,
  } = options;

  if (!isEmpty(where)) {
    Object.keys(where).forEach(field => {
      if (field === 'id') {
        rows = rows.filter(row => row.id === where.id);
      } else if (field === 'search') {
        if (!searchFields || !where.search) {
          return;
        }
        const value = where.search.toLowerCase();
        const searchFilter = row => {
          for (const fieldName of searchFields) {
            if (row[fieldName] && row[fieldName].toLowerCase().includes(value)) {
              return true;
            }
          }
          return false;
        };
        rows = rows.filter(searchFilter);
      } else if (field.indexOf('_contains') >= 0) {
        const fieldName = field.replace('_contains', '');
        const value = where[field];
        rows = rows.filter(row => row[fieldName] && row[fieldName].includes && row[fieldName].includes(value));
      } else if (field.indexOf('_in') >= 0) {
        const fieldName = field.replace('_in', '');
        const list: string[] = where[field] || [];
        rows = rows.filter(row => row[fieldName] && list.indexOf(row[fieldName]) >= 0);
      } else if (field.indexOf('_gt') >= 0) {
        const fieldName = field.replace('_gt', '');
        const value = where[field];
        rows = rows.filter(row => row[fieldName] && row[fieldName] > value);
      } else if (field.indexOf('_lt') >= 0) {
        const fieldName = field.replace('_lt', '');
        const value = where[field];
        rows = rows.filter(row => row[fieldName] && row[fieldName] < value);
      } else if (field.indexOf('_eq') >= 0) {
        const fieldName = field.replace('_eq', '');
        const value = where[field];
        rows = rows.filter(row => row[fieldName] && row[fieldName] === value);
      } else if (field.indexOf('_or') >= 0) {
        // Simple OR filter by multi fields.
        const conditions = where[field];
        if (conditions && conditions.length > 1) {
          const hits = conditions.map(condition => {
            return filter(rows, {where: condition});
          });
          rows = uniq(hits.reduce((prev, next) => prev.concat(next), []));
        }
      }
    });
  }

  // sorting
  if (!isEmpty(order)) {
    let iteratee: any = Object.keys(order)[0];

    let orderValue: 'asc' | 'desc';
    if (order[iteratee] === 'asc') {
      orderValue = 'asc';
    } else if (order[iteratee] === 'desc') {
      orderValue = 'desc';
    } else {
      throw new Error(`order value (${order[iteratee]}) not valid. Should be 'asc' or 'desc'`);
    }

    if (comparators && comparators[iteratee]) {
      iteratee = comparators[iteratee];
    }

    rows = orderBy(rows, [iteratee], [orderValue]);
  }

  return rows;
};

export const extractPagination = (args: any): Pagination => {
  return pick(args, ['last', 'first', 'before', 'after', 'page']);
};

export const getMultivaluedFromAttr =
  (key: string, attributes: Record<string, any>, defaultValue: any, type: any = v => v) => {
    const values = attributes && attributes[key] || defaultValue;
    return values.map(v => type(v));
};

export const getFromAttr = (key: string, attributes: Record<string, any>, defaultValue: any, type: any = v => v) => {
  const value = attributes && attributes[key] && attributes[key][0];
  return isUndefined(value) ? defaultValue : type(value);
};

export const parseFromAttr = (key: string, attributes: Record<string, any>, type: any = v => v) => {
  const value = attributes && attributes[key] && attributes[key][0];
  return isUndefined(value) ? value : type(value);
};

export const mapFromAttr = (attributes: Record<string, any>) => {
  if (isEmpty(attributes)) {
    return {};
  }

  return mapValues(attributes, val => {
    return (val && val[0]) || null;
  });
};

export const toAttr = (attributes: Record<string, any>) => {
  const attrs = reduce(attributes, (result, value, key) => {
    if (isUndefined(value) || isNull(value)) {
      return result;
    }
    result[key] = [value];
    return result;
  }, {});

  return isEmpty(attrs) ? undefined : attrs;
};

export const mutateRelation = async ({
  resource,
  connect,
  disconnect
}: {
  resource: any,
  connect?: (where: {id: string}) => Promise<any>,
  disconnect?: (where: {id: string}) => Promise<any>
}) => {
  if (isEmpty(resource)) {
    return;
  }

  if (!isEmpty(resource.connect) && isArray(resource.connect) && connect) {
    await Promise.all(resource.connect.map(connect));
  }

  if (!isEmpty(resource.disconnect) && isArray(resource.disconnect) && disconnect) {
    await Promise.all(resource.disconnect.map(disconnect));
  }
};

export const serializeEnvs = list => {
  return list.filter(env => !!env.name && env.name.length > 0).map(env => {
    return `${env.name}=${env.value}`;
  });
};

export const deserializeEnvs = list => {
  return list.map(env => {
    const temp = env.split('=');
    return {name: temp[0], value: temp[1]};
  });
};

export const splitByComma = (value: string) => value.split(',');
export const joinByComma = (list: string[]) => list.join(',');
export const stringifyDiskQuota = (quota: number) => `${quota}G`;
export const parseDiskQuota = (quotaWithUnit: string) => {
  if (!quotaWithUnit) {
    return null;
  }
  const value = parseInt(quotaWithUnit.slice(0, -1), 10);
  return isNaN(value) ? null : value;
};
export const stringifyMemory = (mem: number) => `${mem}G`;
export const parseMemory = (memWithUnit: string) => {
  const value = parseFloat(memWithUnit.slice(0, -1));
  return isNaN(value) ? null : value;
};
export const parseBoolean = (value: string) => value === 'true';

export const mergeVariables = (originalVariables: any, newVariables: any) => {
  if (isNull(newVariables)) {
    return null;
  }

  if (isEmpty(newVariables)) {
    return originalVariables;
  }

  const mergedVariables = mapValues(originalVariables, (value, key) => {
    if (isUndefined(newVariables[key])) {
      return null;
    }
    return newVariables[key];
  });

  Object.keys(newVariables).forEach(key => {
    if (isUndefined(mergedVariables[key])) {
      mergedVariables[key] = newVariables[key];
    }
  });
  return mergedVariables;
};

export const stringifyPackageField = (pkgs: string[]): string => {
  return pkgs && pkgs.join(EOL);
};

export const parsePackageField = (pkgs: string): string[] => {
  return pkgs.split(EOL).filter(v => v);
};

export const getGroupIdsByUser = async (context: Context, userId: string) => {
  const groups = await context.kcAdminClient.users.listGroups({
    id: userId,
  });
  return groups.map(group => group.id);
};
