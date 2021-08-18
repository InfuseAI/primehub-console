export type TInstanceType = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  cpuLimit: number;
  memoryLimit: number;
  gpuLimit: number;
  cpuRequest: number;
  memoryRequest: number;
  global: boolean;
  nodeSelector: Record<string, string>;
  tolerations: TToleration[];
};

export type TToleration = {
  /**
   * id is given by the upstream to represent each toleration
   */
  id?: number | string;
  key: string;
  value: string;
  operator: 'Exists' | 'Equal';
  effect: 'None' | 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute' | 'None';
};
