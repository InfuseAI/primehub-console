import { first, last, isUndefined } from 'lodash';

export const toRelay = (rows: any[]) => {
  return {
    edges: rows.map(row => ({
      cursor: row.id,
      node: row
    })),
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: (first(rows) || {}).id,
      endCursor: (last(rows) || {}).id
    }
  };
};

export const getFromAttr = (key: string, attributes: Record<string, any>, defaultValue: any, type: any = v => v) => {
  const value = attributes && attributes[key] && attributes[key][0];
  return isUndefined(value) ? defaultValue : type(value);
};
