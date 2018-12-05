import Koa, {Context} from 'koa';
import { ApolloServer, gql, ApolloError } from 'apollo-server-koa';
import { importSchema } from 'graphql-import';
import path from 'path';
import KcAdminClient from 'keycloak-admin';
import { get, isEmpty } from 'lodash';
import { Issuer } from 'openid-client';
import views from 'koa-views';
import serve from 'koa-static';
import Router from 'koa-router';
import morgan from 'koa-morgan';
import * as GraphQLJSON from 'graphql-type-json';
import { makeExecutableSchema } from 'graphql-tools';
import { applyMiddleware } from 'graphql-middleware';

import CrdClient, { InstanceTypeSpec, DatasetSpec, ImageSpec } from './crdClient/crdClientImpl';
import * as system from './resolvers/system';
import * as user from './resolvers/user';
import * as group from './resolvers/group';
import * as secret from './resolvers/secret';
import { crd as instanceType} from './resolvers/instanceType';
import { crd as dataset} from './resolvers/dataset';
import { crd as image} from './resolvers/image';
import Agent, { HttpsAgent } from 'agentkeepalive';
import { ErrorCodes } from './errorCodes';
import basicAuth from 'basic-auth';
import koaMount from 'koa-mount';

// cache
import {
  memGetDataset,
  memGetImage,
  memGetInstanceType,
  addCacheLayerToKc
} from './cache';

import { CrdCache } from './cache/crdCache';

// controller
import { OidcCtrl, mount as mountOidc } from './oidc';

// config
import {createConfig, Config} from './config';

// observer
import Observer from './observer/observer';
import Boom from 'boom';

// graphql middlewares
import readOnlyMiddleware from './middlewares/readonly';
import TokenSyncer from './oidc/syncer';
import GitSyncSecret from './k8sResource/gitSyncSecret';

// logger
import * as logger from './logger';
import { Item } from './crdClient/customResource';

// The GraphQL schema
const typeDefs = gql(importSchema(path.resolve(__dirname, './graphql/index.graphql')));

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    system: system.query,
    user: user.queryOne,
    users: user.query,
    usersConnection: user.connectionQuery,
    group: group.queryOne,
    groups: group.query,
    groupsConnection: group.connectionQuery,
    secret: secret.queryOne,
    secrets: secret.query,
    secretsConnection: secret.connectionQuery,
    ...instanceType.resolvers(),
    ...dataset.resolvers(),
    ...image.resolvers()
  },
  Mutation: {
    updateSystem: system.update,
    createUser: user.create,
    updateUser: user.update,
    deleteUser: user.destroy,
    sendEmail: user.sendEmail,
    sendMultiEmail: user.sendMultiEmail,
    resetPassword: user.resetPassword,
    createGroup: group.create,
    updateGroup: group.update,
    deleteGroup: group.destroy,
    createSecret: secret.create,
    updateSecret: secret.update,
    deleteSecret: secret.destroy,
    ...instanceType.resolveInMutation(),
    ...dataset.resolveInMutation(),
    ...image.resolveInMutation()
  },
  System: {
    smtp: system.querySmtp
  },
  User: user.typeResolvers,
  Group: group.typeResolvers,
  ...instanceType.typeResolver(),
  ...dataset.typeResolver(),
  ...image.typeResolver(),

  // scalars
  JSON: GraphQLJSON
};

export const createApp = async (): Promise<{app: Koa, server: ApolloServer, config: Config}> => {
  const config = createConfig();
  const staticPath = config.appPrefix ? `${config.appPrefix}/` : '/';

  // gitsync secret client
  const gitSyncSecret = new GitSyncSecret({namespace: config.k8sCrdNamespace});

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
    secret: config.payloadSecretKey,
    realm: config.keycloakRealmName,
    clientId: config.keycloakClientId,
    cmsHost: config.cmsHost,
    keycloakBaseUrl: config.keycloakOidcBaseUrl,
    oidcClient,
    grantType: config.keycloakGrantType,
    appPrefix: config.appPrefix
  });

  const createKcAdminClient = () => new KcAdminClient({
    baseUrl: config.keycloakApiBaseUrl,
    realmName: config.keycloakRealmName,
    requestConfigs: {
      httpAgent,
      httpsAgent
    }
  });

  const crdClient = new CrdClient({
    namespace: config.k8sCrdNamespace
  });

  // token syncer
  const tokenSyncer = new TokenSyncer({
    oidcClient,
    clientId: config.keycloakClientId
  });
  await tokenSyncer.start();

  // create observer with kc client with password
  if (!process.env.TEST) {
    const kcAdminClientForObserver = new KcAdminClient({
      baseUrl: config.keycloakApiBaseUrl,
      realmName: config.keycloakRealmName,
      requestConfigs: {
        httpAgent,
        httpsAgent
      }
    });

    const observer = new Observer({
      crdClient,
      keycloakAdmin: kcAdminClientForObserver,
      everyoneGroupId: config.keycloakEveryoneGroupId,
      getAccessToken: async () => tokenSyncer.getAccessToken()
    });
    observer.observe();
  }

  // crd cache
  const imageCache = new CrdCache({
    resource: 'image',
    originList: crdClient.images.list
  });
  image.setCache(imageCache);

  const instCache = new CrdCache({
    resource: 'instanceType',
    originList: crdClient.instanceTypes.list
  });
  instanceType.setCache(imageCache);

  await imageCache.refetch();
  await instCache.refetch();

  // apollo server
  const schema = makeExecutableSchema({
    typeDefs: typeDefs as any,
    resolvers
  });
  const schemaWithMiddleware = applyMiddleware(schema, readOnlyMiddleware);
  const server = new ApolloServer({
    playground: config.graphqlPlayground,
    tracing: config.apolloTracing,
    debug: true,
    schema: schemaWithMiddleware as any,
    context: async ({ ctx }: { ctx: Koa.Context }) => {
      let readOnly = false;
      let getInstanceType: (name: string) => Promise<Item<InstanceTypeSpec>>;
      let getImage: (name: string) => Promise<Item<ImageSpec>>;

      const kcAdminClient = createKcAdminClient();
      const {authorization = ''}: {authorization: string} = ctx.header;

      // if sharedGraphqlSecretKey is set and token is brought in bearer
      // no matter what grant type is chosen, Bearer type always has higest priority
      if (authorization.indexOf('Bearer') >= 0) {
        const apiToken = authorization.replace('Bearer ', '');

        // sharedGraphqlSecretKey should not be empty
        if (isEmpty(config.sharedGraphqlSecretKey)
            || config.sharedGraphqlSecretKey !== apiToken) {
          throw Boom.forbidden('apiToken not valid');
        }

        // since it's from jupyterHub
        // we use batch for crd resource get method
        getInstanceType = instCache.get;
        getImage = imageCache.get;

        // use service account token and put on readonly mode
        readOnly = true;
        const accessToken = await tokenSyncer.getAccessToken();
        kcAdminClient.setAccessToken(accessToken);
      } else if (config.keycloakGrantType === 'password'
          && authorization.indexOf('Basic') >= 0
      ) {
        // basic auth and specified grant type to password
        // used for test
        const credentials = basicAuth(ctx.req);
        if (!credentials || !credentials.name || !credentials.pass) {
          throw Boom.forbidden('basic auth not valid');
        }

        // use password grant type if specified, or basic auth provided
        await kcAdminClient.auth({
          username: credentials.name,
          password: credentials.pass,
          clientId: config.keycloakClientId,
          clientSecret: config.keycloakClientSecret,
          grantType: 'password',
        });
      } else {
        // default to refresh_token grant type
        const accessToken = await oidcCtrl.getAccessToken(ctx);
        kcAdminClient.setAccessToken(accessToken);
      }

      // cache layer
      addCacheLayerToKc(kcAdminClient);

      return {
        realm: config.keycloakRealmName,
        everyoneGroupId: config.keycloakEveryoneGroupId,
        kcAdminClient,
        crdClient,
        getInstanceType: getInstanceType || memGetInstanceType(crdClient),
        getImage: getImage || memGetImage(crdClient),
        getDataset: memGetDataset(crdClient),
        gitSyncSecret,
        readOnly,
      };
    },
    formatError: error => {
      let errorCode: string;
      let errorMessage: string;
      const additionalProperties: any = {};
      const extensions = error.extensions;
      const exception = extensions.exception;

      // error code override: BoomError > ApolloError > default internal error
      if (exception.isBoom && exception.data && exception.data.code) {
        errorCode = exception.data.code;
        errorMessage = get(exception, 'output.payload.message', 'internal server error');
      } else if (extensions.code) {
        // GraphqlError with code
        errorCode = extensions.code;
        errorMessage = error.message;
      } else {
        errorCode = ErrorCodes.INTERNAL_ERROR;
        errorMessage = 'internal server error';
      }

      // print error message and stacktrace
      logger.error({
        code: errorCode,
        stacktrace: get(exception, 'stacktrace', []).join('\n'),
        httpAgent: httpAgent.getCurrentStatus(),
        httpsAgent: httpsAgent.getCurrentStatus()
      });

      // cusomized handler for error code
      if (errorCode === ErrorCodes.REFRESH_TOKEN_EXPIRED) {
        additionalProperties.loginUrl = extensions.loginUrl;
      }

      return new ApolloError(errorMessage, errorCode, additionalProperties);
    }
  });

  // koa
  const app = new Koa() as any;
  app.keys = [config.cookieSignedKey];

  // setup
  app.use(async (ctx: Context, next) => {
    ctx.state.locale = config.locale;
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
    ? koaMount(config.appPrefix, serve(path.resolve(__dirname, '../../client/dist')))
    : serve(path.resolve(__dirname, '../../client/dist'));
  app.use(serveClientStatic);

  // router
  const rootRouter = new Router({
    prefix: config.appPrefix
  });

  // favicon
  const serveStatic = config.appPrefix
    ? koaMount(config.appPrefix, serve(path.resolve(__dirname, '../static'), {maxage: 86400000}))
    : serve(path.resolve(__dirname, '../static'), {maxage: 86400000});
  rootRouter.get('/favicon/*', serveStatic);
  rootRouter.get('/js/*', serveStatic);
  rootRouter.get('/font/*', serveStatic);

  // ctrl
  mountOidc(rootRouter, oidcCtrl);

  // cms
  rootRouter.get('/cms', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('cms', {title: 'PrimeHub', staticPath});
  });
  rootRouter.get('/cms/*', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('cms', {title: 'PrimeHub', staticPath});
  });

  // health check
  rootRouter.get('/health', async ctx => {
    ctx.status = 204;
  });
  app.use(rootRouter.routes());
  server.applyMiddleware({ app, path: config.appPrefix ? `${config.appPrefix}/graphql` : '/graphql' });
  return {app, server, config};
};
