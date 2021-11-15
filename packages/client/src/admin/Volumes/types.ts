export enum VolumeType {
  PV = 'pv',
  HOSTPATH = 'hostPath',
  NFS = 'nfs',
  GIT = 'git',
  ENV = 'env',
}

export enum VolumePvProvisioning {
  AUTO = 'auto',
  MANUAL = 'manual',
}

type _VolumeBase = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: VolumeType;

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

// Volume query response
export type TVolumeGroups = {
  id: string;
  name: string;
  displayName: string;
  writable: boolean;
}[];

export type TVolume = _VolumeBase & {
  // GitSync
  secret: {
    id: string;
  };

  // Group Association
  groups: TVolumeGroups;
}

// Used for query
export type TVolumeOrderByInput = {
  name: string;
  displayName: string;
  type: string;
  description: string;
  uploadServerLink: string;
};

export type TVolumeWhereInput = {
  id: string;
  name_contains: string;
  displayName_contains: string;
};

// Mutation
export type TVolumeFormSecret = {
  connect: {
    id: string;
  };
  disconnect: boolean;
}

export type TVolumeFormGroups = {
  connect: {
    id: string;
    writable: string;
  }[];
  disconnect: {
    id: string;
  }[];
}

export type TVolumeForm = _VolumeBase & {
  secret: TVolumeFormSecret;
  groups: TVolumeFormGroups;
};

export type VolumeMutationResponse = {
  id: string;
  uploadServerSecret: {
    username: string;
    password: string;
  };
};
