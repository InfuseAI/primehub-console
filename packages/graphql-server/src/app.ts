import Koa, {Context} from 'koa';
import { ApolloServer, ApolloError } from 'apollo-server-koa';
import path from 'path';
import KcAdminClient from 'keycloak-admin';
import { get, isEmpty } from 'lodash';
import { Issuer } from 'openid-client';
import views from 'koa-views';
import serve from 'koa-static';
import Router from 'koa-router';
import morgan from 'koa-morgan';
import { applyMiddleware } from 'graphql-middleware';
import url from 'url';
import CrdClient, { InstanceTypeSpec, ImageSpec } from './crdClient/crdClientImpl';
import { crd as instanceType} from './resolvers/instanceType';
import { crd as image} from './resolvers/image';

import Agent, { HttpsAgent } from 'agentkeepalive';
import { ErrorCodes } from './errorCodes';
import basicAuth from 'basic-auth';
import koaMount from 'koa-mount';
import { OidcTokenVerifier } from './oidc/oidcTokenVerifier';
import cors from '@koa/cors';
import { PodLogs } from './controllers/logCtrl';

// cache
import {
  memGetDataset,
  memGetImage,
  memGetInstanceType,
  addCacheLayerToKc
} from './cache';

import { CrdCache } from './cache/crdCache';

// config
import {createConfig, Config} from './config';

// observer
import Observer from './observer/observer';
import Boom from 'boom';

// graphql middlewares
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
import { createMinioClient } from './utils/minioClient';
import { mountTusCtrl } from './controllers/tusCtrl';
import { mountStoreCtrl } from './controllers/storeCtrl';
import { Telemetry } from './utils/telemetry';
import { createDefaultTraitMiddleware } from './utils/telemetryTraits';
import { schema } from './resolvers';
import { Client as MinioClient } from 'minio';

export class App {
  config;
  k8sSecret: K8sSecret;
  datasetPvc: K8sDatasetPvc;
  groupPvc: K8sGroupPvc;
  k8sUploadServerSecret: K8sUploadServerSecret;
  httpAgent: Agent;
  httpsAgent: HttpsAgent;
  oidcClient;
  oidcTokenVerifier;
  createKcAdminClient: (tokenIssuer?: string) => KcAdminClient;
  crdClient: CrdClient;
  tokenSyncer: TokenSyncer;
  apiTokenCache: ApiTokenCache;
  storeBucket;
  mClient: MinioClient;
  podLogs: PodLogs;
  imageCache;
  instCache;
  telemetry;
  server: ApolloServer;
  app: Koa;

  create = async (): Promise<{app: Koa, server: ApolloServer, config: Config}> => {
    await this.createComponents();
    await this.createTelemetry();
    await this.createApolloServer();
    await this.createKoaServer();
    return {
      config: this.config,
      server: this.server,
      app: this.app,
    };
  }

  /**
   * Supposed to be overriden by EE
   */
  async createComponents() {
    const config = this.config = createConfig();

    // gitsync secret client
    this.k8sSecret = new K8sSecret({namespace: config.k8sCrdNamespace});
    // dataset pvc
    this.datasetPvc = new K8sDatasetPvc({
      namespace: config.k8sCrdNamespace,
      primehubGroupSc: config.primehubGroupSc,
      groupVolumeStorageClass: config.groupVolumeStorageClass,
    });
    // group pvc
    this.groupPvc = new K8sGroupPvc({
      namespace: config.k8sCrdNamespace,
      primehubGroupSc: config.primehubGroupSc,
      groupVolumeStorageClass: config.groupVolumeStorageClass,
    });
    // K8sUploadServerSecret
    this.k8sUploadServerSecret = new K8sUploadServerSecret({
      namespace: config.k8sCrdNamespace
    });

    // construct http agent
    const httpAgent = this.httpAgent = new Agent({
      maxSockets: config.keycloakMaxSockets,
      maxFreeSockets: config.keycloakMaxFreeSockets
    });

    const httpsAgent = this.httpsAgent = new HttpsAgent({
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
    const issuer = new Issuer({
      issuer: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}`,
      authorization_endpoint: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/auth`,
      token_endpoint: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/token`,
      userinfo_endpoint: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/userinfo`,
      jwks_uri: `${config.keycloakApiBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/certs`,
    });
    const oidcClient = this.oidcClient = new issuer.Client({
      client_id: config.keycloakClientId,
      client_secret: config.keycloakClientSecret
    });
    oidcClient.CLOCK_TOLERANCE = 5 * 60;

    // OidcTokenVerifier
    const oidcTokenVerifier = this.oidcTokenVerifier = new OidcTokenVerifier({
      issuer
    });
    // init
    await oidcTokenVerifier.initKeystore();

    this.createKcAdminClient = (tokenIssuer?: string) => {
      const kcAdminClientHeaders = tokenIssuer ? {
        'Host': url.parse(tokenIssuer).host,
        'X-Forwarded-Proto': url.parse(tokenIssuer).protocol.slice(0, -1),
      } : {};

      return new KcAdminClient({
        baseUrl: config.keycloakApiBaseUrl,
        realmName: config.keycloakRealmName,
        requestConfig: {
          httpAgent,
          httpsAgent,
          headers: kcAdminClientHeaders,
        }
      });
    };

    const crdClient = this.crdClient = new CrdClient({
      namespace: config.k8sCrdNamespace
    });

    // token syncer
    const tokenSyncer = this.tokenSyncer = new TokenSyncer({
      oidcClient,
      clientId: config.keycloakClientId
    });
    await tokenSyncer.start();

    // api token cache
    this.apiTokenCache = new ApiTokenCache({
      oidcClient
    });

    // create minio client
    if (config.enableStore) {
      this.storeBucket = config.storeBucket;
      this.mClient = createMinioClient(config.storeEndpoint, config.storeAccessKey, config.storeSecretKey);
    }
    const podLogs = this.podLogs = new PodLogs({
      namespace: config.k8sCrdNamespace,
      crdClient,
      appPrefix: config.appPrefix
    });

    // crd cache
    const imageCache = this.imageCache = new CrdCache({
      resource: 'image',
      originList: crdClient.images.list
    });
    image.setCache(imageCache);

    const instCache = this.instCache = new CrdCache({
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
  }

  /**
   * Supposed to be overriden by EE
   */
  async createTelemetry() {
    const config = this.config;
    let telemetry;
    if (config.enableTelemetry) {
      telemetry = new Telemetry(config.keycloakClientSecret);
      const middleware = createDefaultTraitMiddleware({
        config,
        createKcAdminClient: this.createKcAdminClient,
        getAccessToken: () => this.tokenSyncer.getAccessToken(),
        crdClient: this.crdClient,
      });
      telemetry.addTraitMiddleware(middleware);
      telemetry.start();
    }
    this.telemetry = telemetry;
  }

  async createApolloServer() {
    const server = new ApolloServer({
      playground: this.config.graphqlPlayground,
      // if playground is enabled, so should introspection
      introspection: this.config.graphqlPlayground,
      tracing: this.config.apolloTracing,
      debug: true,
      schema: this.createSchema(),
      context: async ({ctx}) => this.onContext({ctx}),  // force to use arrow function to get the correct 'this'
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
          error,
          extensions,
          exception,
          stacktrace: get(exception, 'stacktrace', []).join('\n'),
          httpAgent: this.httpAgent.getCurrentStatus(),
          httpsAgent: this.httpsAgent.getCurrentStatus()
        });

        // cusomized handler for error code
        if (errorCode === ErrorCodes.REFRESH_TOKEN_EXPIRED) {
          additionalProperties.loginUrl = extensions.loginUrl;
        }
        return new ApolloError(errorMessage, errorCode, additionalProperties);
      }
    });
    this.server = server;
  }

  /**
   * Supposed to be overriden by EE
   */
  createSchema() {
    return applyMiddleware(schema, authMiddleware);
  }

  /**
   * Supposed to be overriden by EE
   */
  async onContext({ ctx }: { ctx: Koa.Context }) {
    let getInstanceType: (name: string) => Promise<Item<InstanceTypeSpec>>;
    let getImage: (name: string) => Promise<Item<ImageSpec>>;
    const config = this.config;
    const keycloakClientId = config.keycloakClientId;
    const useCache = ctx.headers['x-primehub-use-cache'];
    const isJobClient = ctx.headers['x-primehub-job'];
    const minioClient = this.mClient;

    const { kcAdminClient, username, userId, role } = await this.authenticate(ctx);
    if (role === Role.CLIENT) {
      getInstanceType = this.instCache.get;
      getImage = this.imageCache.get;
    } else {
      // if request comes from /jobs or other pages not cms
      // performance would be important.
      // We'll use cache here
      if (isJobClient || useCache) {
        getInstanceType = this.instCache.get;
        getImage = this.imageCache.get;
      }
    }

    // cache layer
    addCacheLayerToKc(kcAdminClient);

    return {
      realm: config.keycloakRealmName,
      everyoneGroupId: config.keycloakEveryoneGroupId,
      kcAdminClient,
      keycloakClientId,
      crdClient: this.crdClient,
      minioClient,
      storeBucket: this.storeBucket,
      getInstanceType: getInstanceType || memGetInstanceType(this.crdClient),
      getImage: getImage || memGetImage(this.crdClient),
      getDataset: memGetDataset(this.crdClient),
      k8sSecret: this.k8sSecret,
      userId,
      username,
      role,
      defaultUserVolumeCapacity: config.defaultUserVolumeCapacity,
      crdNamespace: config.k8sCrdNamespace,
      k8sDatasetPvc: this.datasetPvc,
      k8sGroupPvc: this.groupPvc,
      k8sUploadServerSecret: this.k8sUploadServerSecret,
      namespace: config.k8sCrdNamespace,
      graphqlHost: config.graphqlHost,
      podLogs: this.podLogs,
      telemetry: this.telemetry,
    };
  }

  // koa
  createKoaServer = async () => {
    const app = new Koa() as any;
    const config = this.config;
    const staticPath = config.appPrefix ? `${config.appPrefix}/` : '/';
    app.keys = [config.cookieSignedKey];

    // cors
    app.use(cors({
      allowHeaders: ['content-type', 'authorization', 'x-primehub-use-cache', 'x-primehub-job', 'Content-Length', 'Upload-Length', 'Tus-Resumable', 'Upload-Metadata', 'Upload-Offset', 'Upload-Defer-Length']
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
    this.mountControllers(rootRouter);
    app.use(rootRouter.routes());
    this.server.applyMiddleware({ app, path: config.appPrefix ? `${config.appPrefix}/graphql` : '/graphql' });
    this.app = app;
  }

  /**
   * Authenticate the request from 'Authorizaiotion' header. Return the user information and keycloak client.
   */
  async authenticate(ctx: Koa.Context): Promise<{
    userId: string;
    username: string;
    role: Role;
    kcAdminClient: KcAdminClient;
  }> {
    const {authorization = ''}: {authorization?: string} = ctx.header;
    const config = this.config;
    let kcAdminClient: KcAdminClient;
    let userId: string;
    let username: string;
    let role: Role = Role.NOT_AUTH;

    // if a token is brought in bearer
    // the request could come from internal service (CLIENT) or user's request (UESR or ADMIN)
    // jupyterHub would use sharedGraphqlSecretKey and cms will use accessToken from refresh_token grant flow
    if (authorization.indexOf('Bearer') >= 0) {
      let apiToken = authorization.replace('Bearer ', '');

      // if config.sharedGraphqlSecretKey is set and apiToken equals to it
      if (!isEmpty(config.sharedGraphqlSecretKey) && config.sharedGraphqlSecretKey === apiToken) {
        // since it's from jupyterHub
        // we use batch for crd resource get method
        const accessToken = await this.tokenSyncer.getAccessToken();
        kcAdminClient = this.createKcAdminClient();
        kcAdminClient.setAccessToken(accessToken);
        username = userId = 'jupyterHub';
        role = Role.CLIENT;
      } else {
        // Either config.sharedGraphqlSecretKey not set, or not a sharedGraphqlSecretKey request
        // we verify the token with oidc public key
        let tokenPayload;
        let checkOfflineToken = false;

        try {
          tokenPayload = await this.oidcTokenVerifier.verify(apiToken);
          if (tokenPayload.typ === 'Offline') {
            checkOfflineToken = true;
          }
        } catch (err) {
          // in keycloak8, the offline token JWT is always verified failed.
          checkOfflineToken = true;
        }

        if (checkOfflineToken) {
          // API Token is a offline token. Refresh it to get the real access token
          apiToken = await this.apiTokenCache.getAccessToken(apiToken);
          tokenPayload = await this.oidcTokenVerifier.verify(apiToken);
        }

        userId = tokenPayload.sub;
        username = tokenPayload.preferred_username;

        const roles = get(tokenPayload, ['resource_access', 'realm-management', 'roles'], []);
        if (roles.indexOf('realm-admin') >= 0) {
          role = Role.ADMIN;
          kcAdminClient = this.createKcAdminClient(tokenPayload.iss);
          kcAdminClient.setAccessToken(apiToken);
        } else {
          role = Role.USER;
          const accessToken = await this.tokenSyncer.getAccessToken();
          kcAdminClient = this.createKcAdminClient();
          kcAdminClient.setAccessToken(accessToken);
        }
      }
    } else if (config.keycloakGrantType === 'password'
      && authorization.indexOf('Basic') >= 0) {
      // basic auth and specified grant type to password
      // used for test
      const credentials = basicAuth(ctx.req);
      if (!credentials || !credentials.name || !credentials.pass) {
        throw Boom.forbidden('basic auth not valid');
      }
      username = credentials.name;
      role = Role.ADMIN;

      // use password grant type if specified, or basic auth provided
      kcAdminClient = this.createKcAdminClient();
      await kcAdminClient.auth({
        username: credentials.name,
        password: credentials.pass,
        clientId: config.keycloakClientId,
        clientSecret: config.keycloakClientSecret,
        grantType: 'password',
      });
      const token = new Token(await kcAdminClient.getAccessToken());
      userId = token.getContent().sub;
    } else {
      throw Boom.forbidden('request not authorized');
    }
    return { kcAdminClient, username, userId, role };
  }

  authenticateMiddleware = async (ctx: Koa.Context, next: any) => {
    const auth = await this.authenticate(ctx);
    ctx.role = auth.role;
    ctx.kcAdminClient = auth.kcAdminClient;
    ctx.userId = auth.userId;
    ctx.username = auth.username;

    return next();
  }

  /**
   * Supposed to be overriden by EE
   */
  mountControllers(rootRouter: Router) {
    const config = this.config;
    const staticPath = config.appPrefix ? `${config.appPrefix}/` : '/';

    // redirect
    rootRouter.get('/', async (ctx: any) => {
      return ctx.redirect(`${config.appPrefix || ''}/graphql`);
    });

    // Notebook Log
    this.podLogs.mount(rootRouter, this.authenticateMiddleware);

    // health check
    rootRouter.get('/health', async ctx => {
      ctx.status = 200;
    });

    if (config.enableStore) {
      // store file download api
      mountStoreCtrl(rootRouter, config.appPrefix, this.authenticateMiddleware, this.mClient, this.storeBucket);

      // shared space proxy to tusd
      const tusProxyPath = `${staticPath}tus`;
      mountTusCtrl(rootRouter, tusProxyPath, config, this.authenticateMiddleware);
    }
  }
}
