import { pickBy } from 'lodash';

export interface Config {
  env: string;
  locale: string;
  keycloakBaseUrl: string;
  keycloakRealmName: string;
  keycloakClientId: string;

  // for grant type = password
  keycloakGrantType: string;
  keycloakUsername?: string;
  keycloakPassword?: string;

  // for grant type = authorization_code
  keycloakClientSecret?: string;

  // everyone group
  keycloakEveryoneGroupId: string;
  // k8s
  k8sCrdNamespace: string;
  // payload
  payloadSecretKey: string;
  cookieSignedKey: string;
  // host
  cmsHost: string;
}

const defaultConfigs = {
  env: 'development',
  locale: 'en',
  keycloakBaseUrl: 'http://127.0.0.1:8080/auth',
  keycloakRealmName: 'master',
  keycloakGrantType: 'password',
  keycloakUsername: 'wwwy3y3',
  keycloakPassword: 'wwwy3y3',
  keycloakEveryoneGroupId: '15839617-c0d6-4c3b-8b7e-da3da47409ff',
  keycloakClientId: 'admin-cli',
  k8sCrdNamespace: 'default',
  payloadSecretKey: 'cannerSecret',
  cookieSignedKey: 'cannerSignedCookie',
  cmsHost: 'http://localhost:3000'
};

const prodConfigs = {
  env: 'production'
};

export default (): Config => {
  const envConfigs = pickBy({
    locale: process.env.CANNER_LOCALE,
    keycloakBaseUrl: process.env.KC_BASEURL,
    keycloakRealmName: process.env.KC_REALM,
    keycloakGrantType: process.env.KC_GRANT_TYPE,
    keycloakUsername: process.env.KC_USERNAME,
    keycloakPassword: process.env.KC_PWD,
    keycloakClientSecret: process.env.KC_CLIENT_SECRET,
    keycloakEveryoneGroupId: process.env.KC_EVERYONE_GROUP_ID,
    keycloakClientId: process.env.KC_CLIENT_ID,
    k8sCrdNamespace: process.env.K8S_CRD_NAMESPACE,
    payloadSecretKey: process.env.PAYLOAD_SECRET,
    cookieSignedKey: process.env.COOKIE_SIGNED_KEY
  });

  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return {...defaultConfigs, ...prodConfigs, ...envConfigs};
    default:
      return {...defaultConfigs, ...envConfigs};
  }
};
