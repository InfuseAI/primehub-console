import Koa, {Context} from 'koa';
import path from 'path';
import { Issuer } from 'openid-client';
import views from 'koa-views';
import serve from 'koa-static';
import Router from 'koa-router';
import morgan from 'koa-morgan';

import Agent, { HttpsAgent } from 'agentkeepalive';
import koaMount from 'koa-mount';
import yaml from 'js-yaml';
import fs from 'fs';

// controller
import { OidcCtrl, mount as mountOidc } from './oidc';
import { ProxyCtrl} from './proxy';

// config
import {createConfig, Config} from './config';

// logger
import * as logger from './logger';

export const createApp = async (): Promise<{app: Koa, config: Config}> => {
  const config = createConfig();
  const staticPath = config.appPrefix ? `${config.appPrefix}/` : '/';

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
  Issuer.defaultHttpOptions = {
    agent: {
      http: httpAgent,
      https: httpsAgent
    },
    retries: config.keycloakRetries,
    timeout: config.keycloakTimeout,
  };

  // tslint:disable-next-line:max-line-length
  const issuer =  new Issuer({
    issuer: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}`,
    authorization_endpoint: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/auth`,
    token_endpoint: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/token`,
    userinfo_endpoint: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/userinfo`,
    jwks_uri: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/certs`,
  });

  const oidcClient = new issuer.Client({
    client_id: config.keycloakClientId,
    client_secret: config.keycloakClientSecret
  });
  oidcClient.CLOCK_TOLERANCE = 5 * 60;
  const oidcCtrl = new OidcCtrl({
    config,
    oidcClient,
  });

  // koa
  const app = new Koa() as any;
  app.keys = [config.cookieSignedKey];

  // set proxy=true to support https behind proxy
  app.proxy = true;

  // setup
  app.use(async (ctx: Context, next) => {
    ctx.state.locale = config.locale;
    ctx.state.cmsHost = config.cmsHost;
    ctx.state.graphqlPrefix = config.graphqlPrefix;
    ctx.state.graphqlEndpoint = config.graphqlEndpoint;
    ctx.state.requestApiTokenEndpoint = config.appPrefix ? `${config.appPrefix}/oidc/request-api-token` : '/oidc/request-api-token';
    ctx.state.disableMode = config.readOnlyOnInstanceTypeAndImage;
    ctx.state.enableDatasetUpload = config.enableDatasetUpload;
    ctx.state.enableCustomImage = config.enableCustomImage;
    ctx.state.enableMaintenanceNotebook = config.enableMaintenanceNotebook;
    ctx.state.enableGrafana = config.enableGrafana;
    ctx.state.enableUsageReport = config.enableUsageReport;
    ctx.state.customImageSetup = config.customImageSetup;
    ctx.state.enableLicenseCheck = config.enableLicenseCheck;
    ctx.state.enableModelDeployment = config.enableModelDeployment;
    ctx.state.enableLogPersistence = config.enableLogPersistence;
    ctx.state.enablePhfs = config.enablePhfs;
    ctx.state.enableJobArtifact = config.enableJobArtifact;
    ctx.state.enableJobMonitoring = config.enableJobMonitoring;
    ctx.state.disableGroup = config.enableLicenseCheck ? config.licenseStatus !== 'unexpired' : false;
    ctx.state.everyoneGroupId = config.keycloakEveryoneGroupId;
    ctx.state.jobDefaultActiveDeadlineSeconds = config.jobDefaultActiveDeadlineSeconds;
    ctx.state.primehubVersion = config.primehubVersion;

    // referrer
    const referrer = `${config.cmsHost}${ctx.path}`;
    ctx.state.links = JSON.stringify({
      // tslint:disable-next-line:max-line-length
      userProfileLink: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/account?referrer=${config.keycloakClientId}&referrer_uri=${referrer}`,
      // tslint:disable-next-line:max-line-length
      changePasswordLink: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/account/password?referrer=${config.keycloakClientId}&referrer_uri=${referrer}`,
      adminPortalLink: config.appPrefix ? `${config.appPrefix}/cms` : '/cms',
      logoutLink: config.appPrefix ? `${config.appPrefix}/oidc/logout` : '/oidc/logout',
    });

    return next();
  });

  // error handler
  app.use(async (ctx: Context, next) => {
    try {
      await next();
    } catch (err) {
      const errorCode = (err.isBoom && err.data && err.data.code) ? err.data.code : 'INTERNAL_ERROR';
      const statusCode =
        (err.isBoom && err.output && err.output.statusCode) ? err.output.statusCode : err.status || 500;

      ctx.status = statusCode;

      // render or json
      if (ctx.accepts('html') && ctx.status === 403) {
        return ctx.render('403', {message: err.message, staticPath});
      } else {
        ctx.body = {code: errorCode, message: err.message};
      }
    }
  });

  if (!process.env.TEST) {
    const morganFormat: any = (tokens, req, res) => {
      // Don't print accesslog for proxy traffic. We have already logged it in another place.
      if (req.isProxy) {
        return;
      }

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

  app.use(views(path.join(__dirname, './views'), {
    extension: 'pug'
  }));
  const serveClientStatic = config.appPrefix
    ? koaMount(config.appPrefix, serve(path.resolve(__dirname, '../../client/dist'), {gzip: true, index: false}))
    : serve(path.resolve(__dirname, '../../client/dist'), {gzip: true, index: false});
  app.use(serveClientStatic);

  // router
  const rootRouter = new Router({
    prefix: config.appPrefix
  });

  // redirect
  const home = '/g';
  rootRouter.get(['/', '/landing'], async (ctx: any) => {
    return ctx.redirect(`${config.cmsHost}${config.appPrefix || ''}${home}`);
  });

  // favicon
  const serveStatic = config.appPrefix
    ? koaMount(config.appPrefix, serve(path.resolve(__dirname, '../static'), {maxage: 86400000, index: false}))
    : serve(path.resolve(__dirname, '../static'), {maxage: 86400000, index: false});
  rootRouter.get('/favicon/*', serveStatic);
  rootRouter.get('/js/*', serveStatic);
  rootRouter.get('/font/*', serveStatic);
  rootRouter.get('/css/*', serveStatic);

  // oidc
  mountOidc(rootRouter, oidcCtrl);

  // main
  const homeConfig = yaml.safeLoad(fs.readFileSync(config.homeConfigPath, 'utf8'));
  rootRouter.get('/g', oidcCtrl.loggedIn, async ctx => {
    await ctx.render('main', {
      title: 'PrimeHub',
      staticPath,
      home: JSON.stringify({
        services: homeConfig.services,
        welcomeMessage: homeConfig.welcomeMessage
      })
    });
  });

  rootRouter.get('/g/*', oidcCtrl.loggedIn, async ctx => {
    const apiToken = ctx.cookies.get('apiToken', {signed: true});
    if (apiToken) {
      ctx.state.apiToken = ctx.cookies.get('apiToken', {signed: true});
      ctx.cookies.set('apiToken', {path: staticPath});
    }

    await ctx.render('main', {
      title: 'PrimeHub',
      staticPath,
      home: JSON.stringify({
        services: homeConfig.services,
        welcomeMessage: homeConfig.welcomeMessage
      })
    });
  });

  // cms
  rootRouter.get('/cms', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('cms', {title: 'PrimeHub', staticPath});
  });
  rootRouter.get('/cms/*', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('cms', {title: 'PrimeHub', staticPath});
  });

  // proxy
  const proxy = new ProxyCtrl({
    config,
    oidcCtrl,
  });
  proxy.mount(rootRouter);
  app.upgradeHandler = proxy.createUpgradeHandler();

  // health check
  rootRouter.get('/health', async ctx => {
    ctx.status = 200;
  });
  app.use(rootRouter.routes());
  return {app, config};
};
