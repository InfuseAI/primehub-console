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
  const issuer = await Issuer.discover(`${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/.well-known/openid-configuration`);
  const oidcClient = new issuer.Client({
    client_id: config.keycloakClientId,
    client_secret: config.keycloakClientSecret
  });
  oidcClient.CLOCK_TOLERANCE = 5 * 60;
  const oidcCtrl = new OidcCtrl({
    realm: config.keycloakRealmName,
    clientId: config.keycloakClientId,
    cmsHost: config.cmsHost,
    keycloakBaseUrl: config.keycloakOidcBaseUrl,
    oidcClient,
    appPrefix: config.appPrefix,
    enableUserPortal: config.enableUserPortal
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
    ctx.state.graphqlEndpoint = config.graphqlEndpoint;
    ctx.state.requestApiTokenEndpoint = config.appPrefix ? `${config.appPrefix}/oidc/request-api-token` : '/oidc/request-api-token';
    ctx.state.disableMode = config.readOnlyOnInstanceTypeAndImage;
    ctx.state.enableDatasetUpload = config.enableDatasetUpload;
    ctx.state.enableWorkspace = config.enableWorkspace;
    ctx.state.enableCustomImage = config.enableCustomImage;
    ctx.state.enableMaintenanceNotebook = config.enableMaintenanceNotebook;
    ctx.state.enableGrafana = config.enableGrafana;
    ctx.state.customImageSetup = config.customImageSetup;
    ctx.state.enableLicenseCheck = config.enableLicenseCheck;
    ctx.state.enableModelDeployment = config.enableModelDeployment;
    ctx.state.enableLogPersistence = config.enableLogPersistence;
    ctx.state.disableGroup = config.enableLicenseCheck ? config.licenseStatus !== 'unexpired' : false;
    ctx.state.everyoneGroupId = config.keycloakEveryoneGroupId;

    // referrer
    const referrer = `${config.cmsHost}${ctx.path}`;
    ctx.state.links = JSON.stringify({
      // tslint:disable-next-line:max-line-length
      userProfileLink: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/account?referrer=${config.keycloakClientId}&referrer_uri=${referrer}`,
      // tslint:disable-next-line:max-line-length
      changePasswordLink: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/account/password?referrer=${config.keycloakClientId}&referrer_uri=${referrer}`,
      apiTokenLink: config.appPrefix ? `${config.appPrefix}/api-token` : '/api-token',
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
  const home = config.enableUserPortal ? '/landing' : '/cms';
  rootRouter.get('/', async (ctx: any) => {
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

  // ctrl
  mountOidc(rootRouter, oidcCtrl);

  if (config.enableUserPortal) {
    // read portal config
    const portalConfig = yaml.safeLoad(fs.readFileSync(config.portalConfigPath, 'utf8'));
    rootRouter.get('/landing', oidcCtrl.loggedIn, async ctx => {
      await ctx.render('landing', {
        title: 'PrimeHub',
        staticPath,
        portal: JSON.stringify({
          services: portalConfig.services,
          welcomeMessage: portalConfig.welcomeMessage
        })
      });
    });
  }

  // api token
  rootRouter.get('/api-token', oidcCtrl.loggedIn, async ctx => {
    ctx.state.apiToken = ctx.cookies.get('apiToken', {signed: true});
    ctx.cookies.set('apiToken', null);

    await ctx.render('api-token', {
      title: 'API Token',
      staticPath
    });
  });

  // job
  rootRouter.get('/job', oidcCtrl.loggedIn, async ctx => {
    await ctx.render('job', {
      title: 'PrimeHub Job Submission',
      staticPath
    });
  });

  rootRouter.get('/job/:jobId', oidcCtrl.loggedIn, async ctx => {
    await ctx.render('job', {
      title: 'PrimeHub Job Submission',
      staticPath
    });
  });

  // job schedule
  rootRouter.get('/schedule', oidcCtrl.loggedIn, async ctx => {
    await ctx.render('job', {
      title: 'PrimeHub Job Schedule',
      staticPath
    });
  });

  rootRouter.get('/schedule/:scheduleId', oidcCtrl.loggedIn, async ctx => {
    await ctx.render('job', {
      title: 'PrimeHub Job Schedule',
      staticPath
    });
  });

  // model deployment
  rootRouter.get('/model-deployment', oidcCtrl.loggedIn, async ctx => {
    await ctx.render('model-deployment', {
      title: 'PrimeHub Model Deployment',
      staticPath
    });
  });

  rootRouter.get('/model-deployment/*', oidcCtrl.loggedIn, async ctx => {
    await ctx.render('model-deployment', {
      title: 'PrimeHub Model Deployment',
      staticPath
    });
  });

  // cms
  rootRouter.get('/cms', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('cms', {title: 'PrimeHub', staticPath});
  });
  rootRouter.get('/cms/*', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('cms', {title: 'PrimeHub', staticPath});
  });

  // health check
  rootRouter.get('/health', async ctx => {
    ctx.status = 200;
  });
  app.use(rootRouter.routes());
  return {app, config};
};
