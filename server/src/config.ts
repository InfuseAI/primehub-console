import { pickBy } from 'lodash';

export interface Config {
  env: string;
  keycloakBaseUrl: string;
  keycloakRealmName: string;
  keycloakUsername: string;
  keycloakPassword: string;
  keycloakEveryoneGroupId: string;
  keycloakClientId: string;
}

const envConfigs = pickBy({
  keycloakBaseUrl: process.env.KC_BASEURL,
  keycloakRealmName: process.env.KC_REALM,
  keycloakUsername: process.env.KC_USERNAME,
  keycloakPassword: process.env.KC_PWD,
  keycloakEveryoneGroupId: process.env.KC_EVERYONE_GROUP_ID,
  keycloakClientId: process.env.KC_CLIENT_ID
});

const defaultConfigs = {
  env: 'development',
  keycloakBaseUrl: 'http://127.0.0.1:8080/auth',
  keycloakRealmName: 'master',
  keycloakUsername: 'wwwy3y3',
  keycloakPassword: 'wwwy3y3',
  keycloakEveryoneGroupId: '15839617-c0d6-4c3b-8b7e-da3da47409ff',
  keycloakClientId: 'admin-cli'
};

const prodConfigs = {
  env: 'production'
};

const getConfig = (): Config => {
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return {...defaultConfigs, ...prodConfigs, ...envConfigs};
    default:
      return {...defaultConfigs, ...envConfigs};
  }
};

export default getConfig();
