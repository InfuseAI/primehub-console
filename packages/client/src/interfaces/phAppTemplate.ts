export interface DefaultEnv {
  name: string;
  description: string;
  defaultValue: string;
  optional: boolean;
}

export default interface PhAppTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  version: string;
  docLink: string;
  defaultEnvs: DefaultEnv[];
}
