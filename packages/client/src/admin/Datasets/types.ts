export enum DatasetType {
  PV = 'pv',
  HOSTPATH = 'hostPath',
  NFS = 'nfs',
  GIT = 'git',
  ENV = 'env',
}

export enum DatasetPvProvisioning {
  AUTO = 'auto',
  MANUAL = 'manual',
}

type _DatasetBase = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: DatasetType;

  // Persistence Volume
  pvProvisioning: boolean;
  volumeName: string;
  volumeSize: number;
  // Env
  variables: any;
  // NFS
  nfsServer: string;
  nfsPath: string;
  // Hostpath
  hostPath: string;
  // GitSync
  url: string;
  secret: {
    id: string;
  };
  // Mountable Volumes
  mountRoot: string;
  enableUploadServer: boolean;
  uploadServerLink: string;
  // Group Association
  global: boolean;
};

// Dataset query response
export type TDataset = _DatasetBase & {
  // GitSync
  secret: {
    id: string;
  };

  // Group Association
  groups: {
    id: string;
    name: string;
    displayName: string;
    writable: boolean;
  };
}

// Used for query
export type TDatasetOrderByInput = {
  name: string;
  displayName: string;
  type: string;
  description: string;
  uploadServerLink: string;
};

export type TDatasetWhereInput = {
  id: string;
  name_contains: string;
  displayName_contains: string;
};

// Mutation
export type TDatasetForm = _DatasetBase & {
  // GitSync
  secret: {
    connect: {
      id: string;
    };
    disconnect: boolean;
  };

  // Group Association
  groups: {
    connect: {
      id: string;
      writable: string;
    };
    disconnect: {
      id: string;
    };
  };
};

export type DatasetMutationResponse = {
  id: string;
  uploadServerSecret: {
    username: string;
    password: string;
  };
};
