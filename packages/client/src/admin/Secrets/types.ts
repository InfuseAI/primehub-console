export type SecretType = 'opaque' | 'dockerconfigjson' | undefined;

export type TSecret = {
  id: string;
  name: string;
  displayName: string;
  secret: string;
  registryHost: string;
  username: string;
  password: string;
  type: SecretType;
};
