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
  // TODO: update type
  groups: any[];
  isReady: boolean;
  logEndpoint: string;
  imageSpec: ImageSpec;
  jobStatus: JobStatus;
}

interface ImageSpec {
  baseImage: string;
  pullSecret: string;
  packages: ImageSpecPackages;
  cancel: boolean;
  updateTime: string;
}

interface ImageSpecPackages {
  apt: string[];
  pip: string[];
  conda: string[];
}

interface JobStatus {
  image: string;
  phase: string;
}
