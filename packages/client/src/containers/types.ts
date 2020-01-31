export type FilterPayload = {
  where: {
    groupId_in?: Array<string>,
    mine?: boolean;
  },
  after?: string,
  before?: string,
  last?: number,
  first?: number
};
