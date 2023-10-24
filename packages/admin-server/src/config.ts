import { pickBy, isEmpty } from 'lodash';

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
  graphqlPrefix: string;
  graphqlEndpoint: string;
  graphqlSvcEndpoint: string;
  sharedGraphqlSecretKey: string;

  // user portal
  enableUserPortal: boolean;

  // disable create/update/delete operation on instanceType/image ui
  readOnlyOnInstanceTypeAndImage?: boolean;
  enableDatasetUpload: boolean;

  // custom image
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
  // PHFS
  enablePhfs: boolean;
  // artifact
  enableJobArtifact: boolean;
  // monitoring
  enableJobMonitoring: boolean;
  // PrimeHub App
  enableApp: boolean;
  enableTelemetry: boolean;
  // NPS Survey
  enableNPSSurvey: boolean;
  // maximux group
  licenseStatus: string;
  maxGroup: number;

  jobDefaultActiveDeadlineSeconds: number;
  // primehub version
  primehubVersion: string;

  isUserAdmin: boolean;
  newAccessToken: string;

  enableInviteUsers: boolean;
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
  graphqlPrefix: '/',
  graphqlEndpoint: 'http://localhost:3001/graphql',
  graphqlSvcEndpoint: 'http://localhost:3001/graphql',
  sharedGraphqlSecretKey: '',
  enableUserPortal: false,
  readOnlyOnInstanceTypeAndImage: false,
  enableDatasetUpload: false,
  enableMaintenanceNotebook: false,
  enableUsageReport: false,
  enableGrafana: false,
  customImageSetup: false,
  enableLicenseCheck: false,
  enableModelDeployment: false,
  enableLogPersistence: false,
  enablePhfs: false,
  enableJobArtifact: false,
  enableJobMonitoring: false,
  enableApp: true,
  enableTelemetry: false,
  enableNPSSurvey: false,
  licenseStatus: 'invalid',
  maxGroup: 999,
  jobDefaultActiveDeadlineSeconds: 86400,
  primehubVersion: 'development',
  isUserAdmin: false,
  newAccessToken: '',
  enableInviteUsers: false,
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

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];

  if (val === 'true') {
    return true;
  } else if (val === 'false') {
    return false;
  } else {
    return defaultValue;
  }
}

export const createConfig = (): Config => {
  const envConfigs = pickBy({
    secure: getEnvBoolean('DEV_SECURE', false),
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
    graphqlPrefix: process.env.GRAPHQL_PREFIX,
    graphqlEndpoint: process.env.GRAPHQL_ENDPOINT,
    graphqlSvcEndpoint: process.env.GRAPHQL_SVC_ENDPOINT,
    sharedGraphqlSecretKey: process.env.SHARED_GRAPHQL_SECRET_KEY,
    enableUserPortal: process.env.PRIMEHUB_FEATURE_USER_PORTAL,
    readOnlyOnInstanceTypeAndImage: process.env.READ_ONLY_ON_INSTANCE_TYPE_AND_IMAGE,
    customImageSetup: process.env.PRIMEHUB_CUSTOM_IMAGE_REGISTRY_ENDPOINT ? true : false,
    licenseStatus: process.env.EXPIRED,
    maxGroup: process.env.MAX_GROUP,
    jobDefaultActiveDeadlineSeconds: process.env.JOB_DEFAULT_ACTIVE_DEADLINE_SEC,
    primehubVersion: process.env.PH_VERSION,
    // Feature Flags
    enableDatasetUpload: getEnvBoolean('PRIMEHUB_FEATURE_DATASET_UPLOAD', false),
    enableMaintenanceNotebook: getEnvBoolean('PRIMEHUB_FEATURE_MAINTENANCE_NOTEBOOK', false),
    enableGrafana: getEnvBoolean('PRIMEHUB_FEATURE_GRAFANA', false),
    enableUsageReport: getEnvBoolean('PRIMEHUB_FEATURE_USAGE', false),
    enableLicenseCheck: getEnvBoolean('PRIMEHUB_FEATURE_LICENSE', false),
    enableModelDeployment: getEnvBoolean('PRIMEHUB_FEATURE_MODEL_DEPLOYMENT', true),
    enableLogPersistence: getEnvBoolean('PRIMEHUB_FEATURE_LOG_PERSISTENCE', false),
    enablePhfs: getEnvBoolean('PRIMEHUB_FEATURE_PHFS', false),
    enableJobArtifact: getEnvBoolean('PRIMEHUB_FEATURE_JOB_ARTIFACT', false),
    enableJobMonitoring: getEnvBoolean('PRIMEHUB_FEATURE_JOB_MONITORING', false),
    enableApp: getEnvBoolean('PRIMEHUB_FEATURE_APP', true),
    enableTelemetry: getEnvBoolean('PRIMEHUB_FEATURE_TELEMETRY', false),
    enableNPSSurvey: getEnvBoolean('ENABLE_NPS_SURVEY', false),
    enableInviteUsers: getEnvBoolean('ENABLE_INVITE_USERS', true),
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
