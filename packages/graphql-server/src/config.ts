import { pickBy, isEmpty } from 'lodash';

export interface Config {
  env: string;
  locale: string;
  keycloakApiBaseUrl: string;
  keycloakOidcBaseUrl: string;
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

  // request
  keycloakMaxSockets: number;
  keycloakMaxFreeSockets: number;

  // multi cluster namespace
  rolePrefix?: string;

  // shared client secret key
  sharedGraphqlSecretKey?: string;

  // keycloak
  keycloakRetries: number;
  keycloakTimeout: number;

  appPrefix?: string;
  datasetEndpoint?: string;
  apolloTracing: boolean;
  graphqlPlayground: boolean;

  // system value
  defaultUserVolumeCapacity: string;

  // pvc
  primehubGroupSc?: string;
  enableDatasetUpload: boolean;
  groupVolumeStorageClass: string;

  // workspace feature
  enableWorkspace: boolean;

  // graphql host
  graphqlHost: string;

  // license management stuffs
  maxGroup: number;
  licenseStatus: string;
  licensedTo?: string;
  startedAt?: string;
  expiredAt?: string;

  primehubMode?: string;

  // primehub store
  enableStore: boolean;
  storeAccessKey?: string;
  storeSecretKey?: string;
  storeBucket?: string;
  storeEndpoint?: string;

  // log persistence
  enableLogPersistence: boolean;

  usageReportAPIHost: string;
}

const defaultConfigs = {
  env: 'development',
  locale: 'en',
  keycloakApiBaseUrl: 'http://127.0.0.1:8080/auth',
  keycloakOidcBaseUrl: 'http://127.0.0.1:8080/auth',
  keycloakRealmName: 'master',
  keycloakGrantType: 'password',
  keycloakUsername: 'wwwy3y3',
  keycloakPassword: 'wwwy3y3',
  keycloakEveryoneGroupId: '15839617-c0d6-4c3b-8b7e-da3da47409ff',
  keycloakClientId: 'admin-cli',
  k8sCrdNamespace: 'default',
  payloadSecretKey: 'cannerSecret',
  cookieSignedKey: 'cannerSignedCookie',
  cmsHost: 'http://localhost:3000',
  keycloakMaxSockets: 80,
  keycloakMaxFreeSockets: 10,
  keycloakRetries: 0,
  keycloakTimeout: 3000,
  apolloTracing: false,
  graphqlPlayground: true,
  defaultUserVolumeCapacity: '20G',
  groupVolumeStorageClass: '',
  enableDatasetUpload: false,
  enableWorkspace: false,
  licenseStatus: 'invalid',
  maxGroup: 999,
  graphqlHost: 'http://localhost:3001',
  enableStore: false,
  enableLogPersistence: false,
  usageReportAPIHost: 'http://localhost:5000'
};

const prodConfigs = {
  env: 'production',
  graphqlPlayground: false
};

const sanitizePath = (path: string) => {
  if (isEmpty(path) || path === '/') {
    return null;
  }
  path = path.startsWith('/') ? path : `/${path}`;
  path = path.endsWith('/') ? path.slice(0, -1) : path;
  return path;
};

const sanitizeUrl = (url: string, name: string) => {
  if (isEmpty(url)) {
    return null;
  }

  if (!url.startsWith('http') && !url.startsWith('https')) {
    throw new Error(`env ${name} should start with http|https`);
  }

  url = url.endsWith('/') ? url.slice(0, -1) : url;
  return url;
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
    locale: process.env.CANNER_LOCALE,
    keycloakApiBaseUrl: process.env.KC_API_BASEURL,
    keycloakOidcBaseUrl: process.env.KC_OIDC_BASEURL,
    keycloakRealmName: process.env.KC_REALM,
    keycloakGrantType: process.env.KC_GRANT_TYPE,
    keycloakUsername: process.env.KC_USERNAME,
    keycloakPassword: process.env.KC_PWD,
    keycloakClientSecret: process.env.KC_CLIENT_SECRET,
    keycloakEveryoneGroupId: process.env.KC_EVERYONE_GROUP_ID,
    keycloakClientId: process.env.KC_CLIENT_ID,
    k8sCrdNamespace: process.env.K8S_CRD_NAMESPACE,
    payloadSecretKey: process.env.PAYLOAD_SECRET,
    cookieSignedKey: process.env.COOKIE_SIGNED_KEY,
    cmsHost: process.env.CANNER_CMS_HOST,
    keycloakMaxSockets: process.env.KC_MAX_SOCKETS,
    keycloakMaxFreeSockets: process.env.KC_MAX_FREE_SOCKETS,
    rolePrefix: process.env.KC_ROLE_PREFIX,
    sharedGraphqlSecretKey: process.env.SHARED_GRAPHQL_SECRET_KEY,
    keycloakRetries: process.env.KC_OIDC_RETRIES,
    keycloakTimeout: process.env.KC_OIDC_TIMEOUT ? parseInt(process.env.KC_OIDC_TIMEOUT, 10) : undefined,
    appPrefix: sanitizePath(process.env.APP_PREFIX),
    datasetEndpoint: sanitizeUrl(process.env.DATASET_ENDPOINT, 'datasetEndpoint'),
    apolloTracing: process.env.APOLLO_TRACING,
    graphqlPlayground: process.env.GRAPHQL_PLAYGROUND,
    defaultUserVolumeCapacity: process.env.DEFAULT_USER_VOLUME_CAPACITY,
    primehubGroupSc: process.env.PRIMEHUB_GROUP_SC,
    groupVolumeStorageClass: process.env.PRIMEHUB_GROUP_VOLUME_STORAGE_CLASS,
    graphqlHost: process.env.GRAPHQL_HOST,
    maxGroup: process.env.MAX_GROUP,
    licensedTo: process.env.LICENSED_TO,
    startedAt: process.env.STARTED_AT,
    expiredAt: process.env.EXPIRED_AT,
    licenseStatus: process.env.EXPIRED,
    primehubMode: process.env.PRIMEHUB_MODE,
    storeAccessKey: process.env.PRIMEHUB_STORE_ACCESS_KEY,
    storeSecretKey: process.env.PRIMEHUB_STORE_SECRET_KEY,
    storeBucket: process.env.PRIMEHUB_STORE_BUCKET,
    storeEndpoint: process.env.PRIMEHUB_STORE_ENDPOINT,
    enableLogPersistence:
      process.env.PRIMEHUB_FEATURE_LOG_PERSISTENCE &&
      process.env.PRIMEHUB_FEATURE_LOG_PERSISTENCE.toString() === 'true',
    usageReportAPIHost: process.env.PRIMEHUB_USAGE_REPORT_API_HOST,
    // Feature flags
    enableDatasetUpload: getEnvBoolean('PRIMEHUB_FEATURE_DATASET_UPLOAD', false),
    enableWorkspace: getEnvBoolean('PRIMEHUB_FEATURE_ENABLE_WORKSPACE', false),
    enableStore: getEnvBoolean('PRIMEHUB_FEATURE_STORE', false),
    enableJobArtifact: getEnvBoolean('PRIMEHUB_FEATURE_JOB_ARTIFACT', false),
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
