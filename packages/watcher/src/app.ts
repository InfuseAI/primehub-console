import Koa, {Context} from 'koa';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { Issuer, custom } from 'openid-client';
import Router from 'koa-router';
import morgan from 'koa-morgan';
import Agent, { HttpsAgent } from 'agentkeepalive';
import TokenSyncer from '@infuseai/graphql-server/lib/oidc/syncer';
import CrdClient from '@infuseai/graphql-server/lib/crdClient/crdClientImpl';

// config
import {createConfig, Config} from './config';

// observer
import Observer from './observer';

// logger
import * as logger from './logger';

export const createApp = async (): Promise<{app: Koa, config: Config}> => {
  const config = createConfig();

  // construct http agent
  const httpAgent = new Agent({
    maxSockets: config.keycloakMaxSockets,
    maxFreeSockets: config.keycloakMaxFreeSockets
  });

  const httpsAgent = new HttpsAgent({
    maxSockets: config.keycloakMaxSockets,
    maxFreeSockets: config.keycloakMaxFreeSockets
  });

  // create oidc client and controller
  custom.setHttpOptionsDefaults({
    timeout: config.keycloakTimeout,
  });

  // tslint:disable-next-line:max-line-length
  const issuer =  new Issuer({
    issuer: `${config.keycloakOidcBaseUrl}/auth/realms/${config.keycloakRealmName}`,
    authorization_endpoint: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/auth`,
    token_endpoint: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/token`,
    userinfo_endpoint: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/userinfo`,
    jwks_uri: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/certs`,
  });
  const oidcClient = new issuer.Client({
    client_id: config.keycloakClientId,
    client_secret: config.keycloakClientSecret
  });
  oidcClient[custom.clock_tolerance] = 5 * 60;

  // token syncer
  const tokenSyncer = new TokenSyncer({
    oidcClient,
    clientId: config.keycloakClientId
  });
  await tokenSyncer.start();

  const kcAdminClientForObserver = new KeycloakAdminClient({
    baseUrl: config.keycloakApiBaseUrl,
    realmName: config.keycloakRealmName,
    requestConfig: {
      httpAgent,
      httpsAgent
    }
  });

  const crdClient = new CrdClient({
    namespace: config.k8sCrdNamespace
  });

  const observer = new Observer({
    crdClient,
    keycloakAdmin: kcAdminClientForObserver as any,
    everyoneGroupId: config.keycloakEveryoneGroupId,
    getAccessToken: async () => tokenSyncer.getAccessToken(),
    k8sCrdNamespace: config.k8sCrdNamespace
  });
  observer.observe();

  // koa
  const app = new Koa() as any;

  // error handler
  app.use(async (ctx: Context, next) => {
    try {
      await next();
    } catch (err) {
      const errorCode = (err.isBoom && err.data && err.data.code) ? err.data.code : 'INTERNAL_ERROR';
      const statusCode =
        (err.isBoom && err.output && err.output.statusCode) ? err.output.statusCode : err.status || 500;

      ctx.status = statusCode;

      ctx.body = {code: errorCode, message: err.message};
    }
  });

  if (!process.env.TEST) {
    const morganFormat: any = (tokens, req, res) => {
      return logger.info({
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: parseInt(tokens.status(req, res), 10),
        contentLength: tokens.res(req, res, 'content-length'),
        responseTime: `${tokens['response-time'](req, res)} ms`,
        userAgent: req.headers['user-agent']
      });
    };
    app.use(morgan(morganFormat));
  }

  // router
  const rootRouter = new Router();

  // health check
  rootRouter.get('/health', async ctx => {
    ctx.status = 200;
  });
  app.use(rootRouter.routes());
  return {app, config};
};
