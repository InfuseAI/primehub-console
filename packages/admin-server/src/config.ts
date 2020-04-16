import { pickBy, isEmpty } from 'lodash';
import { resolve } from 'path';

export interface Config {
  env: string;
  locale: string;
  keycloakApiBaseUrl: string;
  keycloakOidcBaseUrl: string;
  keycloakRealmName: string;
  keycloakClientId: string;
  keycloakEveryoneGroupId: string;

  // use https or not, should only be tested in dev
  secure: boolean;

  // for grant type = authorization_code
  keycloakClientSecret?: string;
  cookieSignedKey: string;

  // host
  cmsHost: string;

  // request
  keycloakMaxSockets: number;
  keycloakMaxFreeSockets: number;

  // keycloak
  keycloakRetries: number;
  keycloakTimeout: number;

  appPrefix?: string;

  // standalone graphql endpoint
  graphqlEndpoint: string;

  // user portal
  enableUserPortal: boolean;
  portalConfigPath: string;

  // disable create/update/delete operation on instanceType/image ui
  readOnlyOnInstanceTypeAndImage?: boolean;
  enableDatasetUpload: boolean;

  // workspace feature
  enableWorkspace: boolean;
  // custom image
  enableCustomImage: boolean;
  // license check
  enableLicenseCheck: boolean;
  // model deployment feature
  enableModelDeployment: boolean;
  // maximux group
  licenseStatus: string;
  maxGroup: number;
}

const defaultConfigs = {
  env: 'development',
  secure: false,
  locale: 'en',
  keycloakApiBaseUrl: 'http://127.0.0.1:8080/auth',
  keycloakOidcBaseUrl: 'http://127.0.0.1:8080/auth',
  keycloakRealmName: 'master',
  keycloakClientId: 'admin-cli',
  cookieSignedKey: 'cannerSignedCookie',
  keycloakEveryoneGroupId: '',
  cmsHost: 'http://localhost:3000',
  keycloakMaxSockets: 80,
  keycloakMaxFreeSockets: 10,
  keycloakRetries: 0,
  keycloakTimeout: 3000,
  graphqlEndpoint: 'http://localhost:3001/graphql',
  enableUserPortal: false,
  portalConfigPath: resolve(__dirname, '../etc/portal-config.yaml'),
  readOnlyOnInstanceTypeAndImage: false,
  enableDatasetUpload: false,
  enableWorkspace: false,
  enableCustomImage: false,
  enableLicenseCheck: false,
  enableModelDeployment: false,
  licenseStatus: 'invalid',
  maxGroup: 999
};

const prodConfigs = {
  env: 'production'
};

const sanitizePath = (path: string) => {
  if (isEmpty(path) || path === '/') {
    return null;
  }
  path = path.startsWith('/') ? path : `/${path}`;
  path = path.endsWith('/') ? path.slice(0, -1) : path;
  return path;
};

export const createConfig = (): Config => {
  const envConfigs = pickBy({
    secure:
      process.env.DEV_SECURE && process.env.DEV_SECURE.toString() === 'true',
    locale: process.env.CANNER_LOCALE,
    keycloakApiBaseUrl: process.env.KC_API_BASEURL,
    keycloakOidcBaseUrl: process.env.KC_OIDC_BASEURL,
    keycloakRealmName: process.env.KC_REALM,
    keycloakClientSecret: process.env.KC_CLIENT_SECRET,
    keycloakClientId: process.env.KC_CLIENT_ID,
    keycloakEveryoneGroupId: process.env.KC_EVERYONE_GROUP_ID,
    cookieSignedKey: process.env.COOKIE_SIGNED_KEY,
    cmsHost: process.env.CANNER_CMS_HOST,
    keycloakMaxSockets: process.env.KC_MAX_SOCKETS,
    keycloakMaxFreeSockets: process.env.KC_MAX_FREE_SOCKETS,
    keycloakRetries: process.env.KC_OIDC_RETRIES,
    keycloakTimeout: process.env.KC_OIDC_TIMEOUT ? parseInt(process.env.KC_OIDC_TIMEOUT, 10) : undefined,
    appPrefix: sanitizePath(process.env.APP_PREFIX),
    graphqlEndpoint: process.env.GRAPHQL_ENDPOINT,
    enableUserPortal: process.env.PRIMEHUB_FEATURE_USER_PORTAL,
    portalConfigPath: process.env.PORTAL_CONFIG_PATH,
    readOnlyOnInstanceTypeAndImage: process.env.READ_ONLY_ON_INSTANCE_TYPE_AND_IMAGE,
    enableDatasetUpload:
      process.env.PRIMEHUB_FEATURE_DATASET_UPLOAD && process.env.PRIMEHUB_FEATURE_DATASET_UPLOAD.toString() === 'true',
    enableWorkspace:
      process.env.PRIMEHUB_FEATURE_ENABLE_WORKSPACE &&
      process.env.PRIMEHUB_FEATURE_ENABLE_WORKSPACE.toString() === 'true',
    enableCustomImage:
      process.env.PRIMEHUB_FEATURE_CUSTOM_IMAGE && process.env.PRIMEHUB_FEATURE_CUSTOM_IMAGE.toString() === 'true',
    enableLicenseCheck:
      process.env.PRIMEHUB_FEATURE_LICENSE && process.env.PRIMEHUB_FEATURE_LICENSE.toString() === 'true',
    enableModelDeployment:
      process.env.PRIMEHUB_FEATURE_MODEL_DEPLOYMENT &&
      process.env.PRIMEHUB_FEATURE_MODEL_DEPLOYMENT.toString() === 'true',
    licenseStatus: process.env.EXPIRED,
    maxGroup: process.env.MAX_GROUP
  });

  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return {...defaultConfigs, ...prodConfigs, ...envConfigs};
    default:
      return {...defaultConfigs, ...envConfigs};
  }
};

export default createConfig();
