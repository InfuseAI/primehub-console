export interface Groups {
  id: string;
  name: string;
  displayName: string;
  quotaCpu: string;
  quotaGpu: string;
}
export interface Image {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: string;
  url: string;
  urlForGpu: string;
  groupName: string;
  global: boolean;
  spec: Record<string, unknown>;
  useImagePullSecret: string;
  groups: Groups[];
  isReady: boolean;
  logEndpoint: string;
  imageSpec: ImageSpec;
  jobStatus: JobStatus;
}

export interface ImageSpec {
  baseImage: string;
  pullSecret: string;
  packages: ImageSpecPackages;
  cancel?: boolean;
  updateTime?: string;
}

interface ImageSpecPackages {
  apt: string[];
  pip: string[];
  conda: string[];
}

interface JobStatus {
  image: string;
  phase:
    | 'Pending'
    | 'Preparing'
    | 'Running'
    | 'Succeeded'
    | 'Failed'
    | 'Cancelled'
    | 'Unknown';
}
