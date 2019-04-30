import { pickBy, isEmpty } from 'lodash';

export interface Config {
  env: string;
  locale: string;
  keycloakApiBaseUrl: string;
  keycloakOidcBaseUrl: string;
  keycloakRealmName: string;
  keycloakClientId: string;

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
}

const defaultConfigs = {
  env: 'development',
  locale: 'en',
  keycloakApiBaseUrl: 'http://127.0.0.1:8080/auth',
  keycloakOidcBaseUrl: 'http://127.0.0.1:8080/auth',
  keycloakRealmName: 'master',
  keycloakClientId: 'admin-cli',
  cookieSignedKey: 'cannerSignedCookie',
  cmsHost: 'http://localhost:3000',
  keycloakMaxSockets: 80,
  keycloakMaxFreeSockets: 10,
  keycloakRetries: 0,
  keycloakTimeout: 3000,
  graphqlEndpoint: 'http://localhost:3001/graphql'
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
    locale: process.env.CANNER_LOCALE,
    keycloakApiBaseUrl: process.env.KC_API_BASEURL,
    keycloakOidcBaseUrl: process.env.KC_OIDC_BASEURL,
    keycloakRealmName: process.env.KC_REALM,
    keycloakClientSecret: process.env.KC_CLIENT_SECRET,
    keycloakClientId: process.env.KC_CLIENT_ID,
    cookieSignedKey: process.env.COOKIE_SIGNED_KEY,
    cmsHost: process.env.CANNER_CMS_HOST,
    keycloakMaxSockets: process.env.KC_MAX_SOCKETS,
    keycloakMaxFreeSockets: process.env.KC_MAX_FREE_SOCKETS,
    keycloakRetries: process.env.KC_OIDC_RETRIES,
    keycloakTimeout: process.env.KC_OIDC_TIMEOUT ? parseInt(process.env.KC_OIDC_TIMEOUT, 10) : undefined,
    appPrefix: sanitizePath(process.env.APP_PREFIX),
    graphqlEndpoint: process.env.GRAPHQL_ENDPOINT
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
