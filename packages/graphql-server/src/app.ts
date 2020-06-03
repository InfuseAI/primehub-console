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
import WorkspaceApi from './workspace/api';
import CrdClient, { InstanceTypeSpec, ImageSpec } from './crdClient/crdClientImpl';
import * as system from './resolvers/system';
import * as user from './resolvers/user';
import * as group from './resolvers/group';
import * as secret from './resolvers/secret';
import * as workspace from './resolvers/workspace';
import { crd as instanceType} from './resolvers/instanceType';
import { crd as dataset, regenerateUploadSecret} from './resolvers/dataset';
import { crd as image} from './resolvers/image';
import { crd as ann} from './resolvers/announcement';
import Agent, { HttpsAgent } from 'agentkeepalive';
import { ErrorCodes } from './errorCodes';
import basicAuth from 'basic-auth';
import koaMount from 'koa-mount';
import { OidcTokenVerifier } from './oidc/oidcTokenVerifier';
import cors from '@koa/cors';

// cache
import {
  memGetDataset,
  memGetImage,
  memGetInstanceType,
  addCacheLayerToKc
} from './cache';

import { CrdCache } from './cache/crdCache';

// controller
import { AnnCtrl, mount as mountAnn } from './announcement';

// config
import {createConfig, Config} from './config';

// observer
import Observer from './observer/observer';
import Boom from 'boom';

// graphql middlewares
import readOnlyMiddleware from './middlewares/readonly';
import { permissions as authMiddleware } from './middlewares/auth';
import TokenSyncer from './oidc/syncer';
import K8sSecret from './k8sResource/k8sSecret';
import K8sDatasetPvc from './k8sResource/k8sDatasetPvc';
import K8sGroupPvc from './k8sResource/k8sGroupPvc';

// logger
import * as logger from './logger';
import { Item } from './crdClient/customResource';
import K8sUploadServerSecret from './k8sResource/k8sUploadServerSecret';
import { Role } from './resolvers/interface';
import Token from './oidc/token';
import ApiTokenCache from './oidc/apiTokenCache';

// The GraphQL schema
const typeDefs = gql(importSchema(path.resolve(__dirname, './graphql/index.graphql')));

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    system: system.query,
    me: user.me,
    user: user.queryOne,
    users: user.query,
    usersConnection: user.connectionQuery,
    group: group.queryOne,
    groups: group.query,
    groupsConnection: group.connectionQuery,
    secret: secret.queryOne,
    secrets: secret.query,
    secretsConnection: secret.connectionQuery,
    workspace: workspace.queryOne,
    workspaces: workspace.query,
    workspacesConnection: workspace.connectionQuery,
    ...instanceType.resolvers(),
    ...dataset.resolvers(),
    ...image.resolvers(),
    ...ann.resolvers()
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
    createWorkspace: workspace.create,
    updateWorkspace: workspace.update,
    deleteWorkspace: workspace.destroy,
    regenerateUploadServerSecret: regenerateUploadSecret,
    ...instanceType.resolveInMutation(),
    ...dataset.resolveInMutation(),
    ...image.resolveInMutation(),
    ...ann.resolveInMutation()
  },
  System: {
    smtp: system.querySmtp
  },
  User: user.typeResolvers,
  Group: group.typeResolvers,
  Workspace: workspace.typeResolvers,
  ...instanceType.typeResolver(),
  ...dataset.typeResolver(),
  ...image.typeResolver(),
  ...ann.typeResolver(),

  // scalars
  JSON: GraphQLJSON
};

export const createApp = async (): Promise<{app: Koa, server: ApolloServer, config: Config}> => {
  const config = createConfig();
  const staticPath = config.appPrefix ? `${config.appPrefix}/` : '/';

  // gitsync secret client
  const k8sSecret = new K8sSecret({namespace: config.k8sCrdNamespace});
  // dataset pvc
  const datasetPvc = new K8sDatasetPvc({
    namespace: config.k8sCrdNamespace,
    primehubGroupSc: config.primehubGroupSc
  });
  // group pvc
  const groupPvc = new K8sGroupPvc({
    namespace: config.k8sCrdNamespace,
    primehubGroupSc: config.primehubGroupSc,
    groupVolumeStorageClass: config.groupVolumeStorageClass
  });
  // K8sUploadServerSecret
  const k8sUploadServerSecret = new K8sUploadServerSecret({
    namespace: config.k8sCrdNamespace
  });

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

  // OidcTokenVerifier
  const oidcTokenVerifier = new OidcTokenVerifier({
    issuer
  });
  // init
  await oidcTokenVerifier.initKeystore();

  const createKcAdminClient = () => new KcAdminClient({
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

  // token syncer
  const tokenSyncer = new TokenSyncer({
    oidcClient,
    clientId: config.keycloakClientId
  });
  await tokenSyncer.start();

  // api token cache
  const apiTokenCache = new ApiTokenCache({
    oidcClient
  });
  // ann
  const annCtrl = new AnnCtrl({
    createKcAdminClient,
    sharedGraphqlSecretKey: config.sharedGraphqlSecretKey,
    getAccessToken: () => tokenSyncer.getAccessToken()
  });

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

  // create observer
  const observer = new Observer({
    crdClient,
    imageOnChange: () => {
      imageCache.clear();
    },
    instanceTypeOnChange: () => {
      instCache.clear();
    }
  });
  observer.observe();

  // apollo server
  const schema: any = makeExecutableSchema({
    typeDefs: typeDefs as any,
    resolvers
  });
  const schemaWithMiddleware = applyMiddleware(schema, readOnlyMiddleware, authMiddleware);
  const server = new ApolloServer({
    playground: config.graphqlPlayground,
    // if playground is enabled, so should introspection
    introspection: config.graphqlPlayground,
    tracing: config.apolloTracing,
    debug: true,
    schema: schemaWithMiddleware as any,
    context: async ({ ctx }: { ctx: Koa.Context }) => {
      let readOnly = false;
      let userId: string;
      let username: string;
      let role: Role = Role.NOT_AUTH;
      let getInstanceType: (name: string) => Promise<Item<InstanceTypeSpec>>;
      let getImage: (name: string) => Promise<Item<ImageSpec>>;

      const kcAdminClient = createKcAdminClient();
      const {authorization = ''}: {authorization: string} = ctx.header;
      const useCache = ctx.headers['x-primehub-use-cache'];
      const isJobClient = ctx.headers['x-primehub-job'];

      // if a token is brought in bearer
      // the request could come from jupyterHub or cms
      // jupyterHub would use sharedGraphqlSecretKey and cms will use accessToken from refresh_token grant flow
      if (authorization.indexOf('Bearer') >= 0) {
        let apiToken = authorization.replace('Bearer ', '');

        // if config.sharedGraphqlSecretKey is set and apiToken equals to it
        if (!isEmpty(config.sharedGraphqlSecretKey) && config.sharedGraphqlSecretKey === apiToken) {
          // since it's from jupyterHub
          // we use batch for crd resource get method
          const accessToken = await tokenSyncer.getAccessToken();
          kcAdminClient.setAccessToken(accessToken);
          getInstanceType = instCache.get;
          getImage = imageCache.get;
          readOnly = true;
          username = userId = 'jupyterHub';
          role = Role.CLIENT;
        } else {
          // Either config.sharedGraphqlSecretKey not set, or not a sharedGraphqlSecretKey request
          // we verify the token with oidc public key
          let tokenPayload;
          let checkOfflineToken = false;

          try {
            tokenPayload = await oidcTokenVerifier.verify(apiToken);
            if (tokenPayload.typ === 'Offline') {
              checkOfflineToken = true;
            }
          } catch (err) {
            // in keycloak8, the offline token JWT is always verified failed.
            checkOfflineToken = true;
          }

          if (checkOfflineToken) {
            // API Token is a offline token. Refresh it to get the real access token
            apiToken = await apiTokenCache.getAccessToken(apiToken);
            tokenPayload = await oidcTokenVerifier.verify(apiToken);
          }
          userId = tokenPayload.sub;
          username = tokenPayload.preferred_username;

          // check if user is admin
          const roles = get(tokenPayload, ['resource_access', 'realm-management', 'roles'], []);
          if (roles.indexOf('realm-admin') >= 0) {
            role = Role.ADMIN;
            kcAdminClient.setAccessToken(apiToken);
          } else {
            role = Role.USER;

            // also, we need admin token to access keycloak api
            // this part rely on authMiddleware to control the permission
            // todo: maybe we can use other api to access personal account data?
            const accessToken = await tokenSyncer.getAccessToken();
            kcAdminClient.setAccessToken(accessToken);
          }

          // if request comes from /jobs or other pages not cms
          // performance would be important.
          // We'll use cache here
          if (isJobClient || useCache) {
            getInstanceType = instCache.get;
            getImage = imageCache.get;
          }
        }
      } else if (config.keycloakGrantType === 'password'
          && authorization.indexOf('Basic') >= 0
      ) {
        // basic auth and specified grant type to password
        // used for test
        const credentials = basicAuth(ctx.req);
        if (!credentials || !credentials.name || !credentials.pass) {
          throw Boom.forbidden('basic auth not valid');
        }
        username = credentials.name;
        role = Role.ADMIN;

        // use password grant type if specified, or basic auth provided
        await kcAdminClient.auth({
          username: credentials.name,
          password: credentials.pass,
          clientId: config.keycloakClientId,
          clientSecret: config.keycloakClientSecret,
          grantType: 'password',
        });
        const token = new Token(kcAdminClient.getAccessToken());
        userId = token.getContent().sub;
      } else {
        throw Boom.forbidden('request not authorized');
      }

      // cache layer
      addCacheLayerToKc(kcAdminClient);

      // workspace
      const workspaceApi = new WorkspaceApi({
        defaultNamespace: config.k8sCrdNamespace,
        enableWorkspace: config.enableWorkspace,
        kcAdminClient
      });

      return {
        realm: config.keycloakRealmName,
        everyoneGroupId: config.keycloakEveryoneGroupId,
        kcAdminClient,
        crdClient,
        getInstanceType: getInstanceType || memGetInstanceType(crdClient),
        getImage: getImage || memGetImage(crdClient),
        getDataset: memGetDataset(crdClient),
        k8sSecret,
        readOnly,
        userId,
        username,
        role,
        defaultUserVolumeCapacity: config.defaultUserVolumeCapacity,
        workspaceApi,
        crdNamespace: config.k8sCrdNamespace,
        k8sDatasetPvc: datasetPvc,
        k8sGroupPvc: groupPvc,
        k8sUploadServerSecret,
        namespace: config.k8sCrdNamespace,
        graphqlHost: config.graphqlHost,
      };
    },
    formatError: (error: any) => {
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

  // cors
  app.use(cors({
    allowHeaders: ['content-type', 'authorization', 'x-primehub-use-cache', 'x-primehub-job']
  }));

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
    ? koaMount(config.appPrefix, serve(path.resolve(__dirname, '../../client/dist'), {gzip: true, index: false}))
    : serve(path.resolve(__dirname, '../../client/dist'), {gzip: true, index: false});
  app.use(serveClientStatic);

  // router
  const rootRouter = new Router({
    prefix: config.appPrefix
  });

  // redirect
  rootRouter.get('/', async (ctx: any) => {
    return ctx.redirect(`${config.appPrefix || ''}/graphql`);
  });

  // ctrl
  const authenticateMiddleware = async (ctx: Koa.ParameterizedContext, next: any) => {
    const {authorization = ''}: {authorization: string} = ctx.header;

    if (authorization.indexOf('Bearer') < 0) {
      throw Boom.forbidden('request not authorized');
    }

    const apiToken = authorization.replace('Bearer ', '');

    if (!isEmpty(config.sharedGraphqlSecretKey) && config.sharedGraphqlSecretKey === apiToken) {
      return next();
    } else {
      await oidcTokenVerifier.verify(apiToken);
      return next();
    }
  };
  mountAnn(rootRouter, annCtrl);

  // health check
  rootRouter.get('/health', async ctx => {
    ctx.status = 200;
  });
  app.use(rootRouter.routes());
  server.applyMiddleware({ app, path: config.appPrefix ? `${config.appPrefix}/graphql` : '/graphql' });
  return {app, server, config};
};
