import Koa from 'koa';
import path from 'path';
import { Issuer } from 'openid-client';
import views from 'koa-views';
import serve from 'koa-static';
import Router from 'koa-router';
import morgan from 'koa-morgan';
import Agent, { HttpsAgent } from 'agentkeepalive';
import koaMount from 'koa-mount';
import md5 from 'md5';

// controller
import { OidcCtrl, mount as mountOidc } from './oidc';
import { ProxyCtrl } from './proxy';

// config
import { createConfig, Config } from './config';
import createEnvVariablesSetup from './createEnvVariablesSetup';
import errorHandler from './errorHandler';

// logger
import * as logger from './logger';

export const createApp = async (): Promise<{ app: Koa; config: Config }> => {
  const config = createConfig();
  const staticPath = config.appPrefix ? config.appPrefix : '';

  // construct http agent
  const httpAgent = new Agent({
    maxSockets: config.keycloakMaxSockets,
    maxFreeSockets: config.keycloakMaxFreeSockets,
  });

  const httpsAgent = new HttpsAgent({
    maxSockets: config.keycloakMaxSockets,
    maxFreeSockets: config.keycloakMaxFreeSockets,
  });

  // create oidc client and controller
  Issuer.defaultHttpOptions = {
    agent: {
      http: httpAgent,
      https: httpsAgent,
    },
    retries: config.keycloakRetries,
    timeout: config.keycloakTimeout,
  };

  // tslint:disable-next-line:max-line-length
  const issuer = new Issuer({
    issuer: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}`,
    authorization_endpoint: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/auth`,
    token_endpoint: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/token`,
    userinfo_endpoint: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/userinfo`,
    jwks_uri: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/certs`,
  });

  const oidcClient = new issuer.Client({
    client_id: config.keycloakClientId,
    client_secret: config.keycloakClientSecret,
  });
  oidcClient.CLOCK_TOLERANCE = 5 * 60;
  const oidcCtrl = new OidcCtrl({
    config,
    oidcClient,
  });

  // koa
  const app = new Koa();
  app.keys = [config.cookieSignedKey];

  // set proxy=true to support https behind proxy
  app.proxy = true;

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
        userAgent: req.headers['user-agent'],
      });
    };
    app.use(morgan(morganFormat));
  }

  app.use(createEnvVariablesSetup());
  app.use(errorHandler());
  app.use(
    views(path.resolve(__dirname, '../../client/dist'), { extension: 'ejs' })
  );
  const serveClientStatic = config.appPrefix
    ? koaMount(config.appPrefix, serve(path.resolve(__dirname, '../../client/dist'), {gzip: true, index: false}))
    : serve(path.resolve(__dirname, '../../client/dist'), {gzip: true, index: false});
  app.use(serveClientStatic);

  // router
  const rootRouter = new Router({
    prefix: config.appPrefix,
  });

  // redirect
  const home = '/g';
  rootRouter.get(['/', '/landing'], async (ctx: any) => {
    return ctx.redirect(`${config.cmsHost}${config.appPrefix || ''}${home}`);
  });
  const serveStatic = config.appPrefix
    ? koaMount(
        config.appPrefix,
        serve(path.resolve(__dirname, '../static'), {
          maxage: 86400000,
          index: false,
        })
      )
    : serve(path.resolve(__dirname, '../static'), {
        maxage: 86400000,
        index: false,
      });
  rootRouter.get('/assets/*', serveStatic);

  // oidc
  mountOidc(rootRouter, oidcCtrl);

  // main
  rootRouter.get('/g', oidcCtrl.loggedIn, async ctx => {
    await ctx.render('index', {
      title: 'PrimeHub',
      staticPath,
    });
  });

  rootRouter.get('/g/*', oidcCtrl.loggedIn, async ctx => {
    const apiToken = ctx.cookies.get('apiToken', { signed: true });

    if (apiToken) {
      ctx.state.apiToken = ctx.cookies.get('apiToken', { signed: true });
      ctx.cookies.set('apiToken', { path: staticPath });
    }

    // send anonymousId to client by cookie
    const anonymousId = ctx.cookies.get('primehubAnonymousId', { signed: true }) || '';
    if (anonymousId === '') {
      const clusterId = md5(config.keycloakClientSecret);
      const httpOnly = !config.cmsHost.startsWith('https://');
      ctx.cookies.set('primehubAnonymousId', clusterId, {
        httpOnly: httpOnly
      });
    }

    await ctx.render('index', {
      title: 'PrimeHub',
      staticPath,
    });
  });

  // preview
  rootRouter.get('/preview/*', oidcCtrl.loggedIn, async ctx => {
    await ctx.render('index', {
      title: 'PrimeHub',
      staticPath,
    });
  });

  // Admin Portal
  rootRouter.get('/admin', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('admin', {
      title: 'PrimeHub',
      staticPath,
    });
  });
  rootRouter.get('/admin/*', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('admin', {
      title: 'PrimeHub',
      staticPath,
    });
  });

  // proxy
  const proxy = new ProxyCtrl({
    config,
    oidcCtrl,
  });
  proxy.mount(rootRouter);

  // @ts-ignore
  app.upgradeHandler = proxy.createUpgradeHandler();

  // health check
  rootRouter.get('/health', async ctx => {
    ctx.status = 200;
  });
  app.use(rootRouter.routes());

  return { app, config };
};
