export interface Dataset {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  size: number;
}

export interface DatasetConnection {
  pageInfo: {
    currentPage?: number;
    totalPage?: number;
  };
  edges: Array<{
    cursor: string;
    node: Dataset;
  }>;
}
