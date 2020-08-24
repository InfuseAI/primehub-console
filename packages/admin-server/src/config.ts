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
  homeConfigPath: string;

  // disable create/update/delete operation on instanceType/image ui
  readOnlyOnInstanceTypeAndImage?: boolean;
  enableDatasetUpload: boolean;

  // workspace feature
  enableWorkspace: boolean;
  // image builder
  // TODO: need rename variable to image builder for consistently
  enableCustomImage: boolean;
  // image builder should have registry setup, use env.PRIMEHUB_CUSTOM_IMAGE_REGISTRY_ENDPOINT to determine it.
  customImageSetup: boolean;

  enableMaintenanceNotebook: boolean;
  enableGrafana: boolean;
  enableUsageReport: boolean;

  // license check
  enableLicenseCheck: boolean;
  // model deployment feature
  enableModelDeployment: boolean;
  // persistence log feature
  enableLogPersistence: boolean;

  // maximux group
  licenseStatus: string;
  maxGroup: number;
  // primehub version
  primehubVersion: string;
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
  homeConfigPath: resolve(__dirname, '../etc/home-config.yaml'),
  readOnlyOnInstanceTypeAndImage: false,
  enableDatasetUpload: false,
  enableWorkspace: false,
  enableCustomImage: false,
  enableMaintenanceNotebook: false,
  enableUsageReport: false, 
  enableGrafana: false,
  customImageSetup: false,
  enableLicenseCheck: false,
  enableModelDeployment: false,
  enableLogPersistence: false,
  licenseStatus: 'invalid',
  maxGroup: 999,
  primehubVersion: 'development'
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
    homeConfigPath: process.env.HOME_CONFIG_PATH,
    readOnlyOnInstanceTypeAndImage: process.env.READ_ONLY_ON_INSTANCE_TYPE_AND_IMAGE,
    enableDatasetUpload:
      process.env.PRIMEHUB_FEATURE_DATASET_UPLOAD && process.env.PRIMEHUB_FEATURE_DATASET_UPLOAD.toString() === 'true',
    enableWorkspace:
      process.env.PRIMEHUB_FEATURE_ENABLE_WORKSPACE &&
      process.env.PRIMEHUB_FEATURE_ENABLE_WORKSPACE.toString() === 'true',
    enableCustomImage:
      process.env.PRIMEHUB_FEATURE_CUSTOM_IMAGE && process.env.PRIMEHUB_FEATURE_CUSTOM_IMAGE.toString() === 'true',
    enableMaintenanceNotebook:
      process.env.PRIMEHUB_FEATURE_MAINTENANCE_NOTEBOOK && process.env.PRIMEHUB_FEATURE_MAINTENANCE_NOTEBOOK.toString() === 'true',
    enableGrafana:
      process.env.PRIMEHUB_FEATURE_GRAFANA && process.env.PRIMEHUB_FEATURE_GRAFANA.toString() === 'true',
    enableUsageReport:
      process.env.PRIMEHUB_FEATURE_USAGE && process.env.PRIMEHUB_FEATURE_USAGE.toString() === 'true',
    customImageSetup: process.env.PRIMEHUB_CUSTOM_IMAGE_REGISTRY_ENDPOINT ? true : false,
    enableLicenseCheck:
      process.env.PRIMEHUB_FEATURE_LICENSE && process.env.PRIMEHUB_FEATURE_LICENSE.toString() === 'true',
    enableModelDeployment:
      process.env.PRIMEHUB_FEATURE_MODEL_DEPLOYMENT &&
      process.env.PRIMEHUB_FEATURE_MODEL_DEPLOYMENT.toString() === 'true',
    enableLogPersistence:
      process.env.PRIMEHUB_FEATURE_LOG_PERSISTENCE &&
      process.env.PRIMEHUB_FEATURE_LOG_PERSISTENCE.toString() === 'true',
    licenseStatus: process.env.EXPIRED,
    maxGroup: process.env.MAX_GROUP,
    primehubVersion: process.env.PH_VERSION
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
