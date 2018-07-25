import { first, last } from 'lodash';

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
