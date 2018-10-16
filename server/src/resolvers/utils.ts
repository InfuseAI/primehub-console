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
  mapValues,
  isNaN
} from 'lodash';
import { takeWhile, takeRightWhile, take, takeRight, flow } from 'lodash/fp';

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

export const filter = (rows: any[], where?: any) => {
  if (isEmpty(where)) {
    return rows;
  }

  Object.keys(where).forEach(field => {
    if (field === 'id') {
      rows = rows.filter(row => row.id === where.id);
    } else if (field.indexOf('contains') >= 0) {
      const fieldName = field.replace('_contains', '');
      const value = where[field];
      rows = rows.filter(row => row[fieldName] && row[fieldName].includes && row[fieldName].includes(value));
    }
  });
  return rows;
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

export const stringifyDiskQuota = (quota: number) => `${quota}G`;
export const parseDiskQuota = (quotaWithUnit: string) => {
  const value = parseInt(quotaWithUnit.slice(0, -1), 10);
  return isNaN(value) ? null : value;
};
export const stringifyMemory = (mem: number) => `${mem}G`;
export const parseMemory = (memWithUnit: string) => {
  const value = parseFloat(memWithUnit.slice(0, -1));
  return isNaN(value) ? null : value;
};

export const mergeVariables = (originalVariables: any, newVariables: any) => {
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
