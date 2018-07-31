import { first as _first, last as _last, isUndefined, isEmpty } from 'lodash';
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

export const getFromAttr = (key: string, attributes: Record<string, any>, defaultValue: any, type: any = v => v) => {
  const value = attributes && attributes[key] && attributes[key][0];
  return isUndefined(value) ? defaultValue : type(value);
};
