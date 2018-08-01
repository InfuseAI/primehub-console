import {
  first as _first,
  last as _last,
  isUndefined,
  isEmpty,
  isNull,
  pick,
  find,
  reduce,
  isArray,
  mapValues
} from 'lodash';
import { takeWhile, takeRightWhile, take, takeRight, flow } from 'lodash/fp';
import KcAdminClient from 'keycloak-admin';

export interface Pagination {
  last?: number;
  first?: number;
  before?: string;
  after?: string;
}

export const paginate = (rows: any[], pagination?: Pagination) => {
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

  const paginatedRows = paginate(rows, pagination);

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

export const extractPagination = (args: any): Pagination => {
  return pick(args, ['last', 'first', 'before', 'after']);
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

export const findResourceInGroup = async ({
  kcAdminClient, groupId, resourceName}:
  {kcAdminClient: KcAdminClient, groupId: string, resourceName: string}): Promise<boolean> => {
  const roles = await kcAdminClient.groups.listRealmRoleMappings({
    id: groupId
  });
  return Boolean(find(roles, role => role.name.slice(3) === resourceName));
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
