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
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools';
import { applyMiddleware } from 'graphql-middleware';
import { keycloakMaxCount } from '../resolvers/constant';
import request from 'request';
import mime from 'mime';
import url from 'url';

import CrdClient, { InstanceTypeSpec, ImageSpec, client as kubeClient, kubeConfig } from '../crdClient/crdClientImpl';
import * as system from '../resolvers/system';
import * as user from '../resolvers/user';
import * as group from '../resolvers/group';
import * as secret from '../resolvers/secret';
import * as buildImage from './resolvers/buildImage';
import * as buildImageJob from './resolvers/buildImageJob';
import * as phJob from './resolvers/phJob';
import * as phSchedule from './resolvers/phSchedule';
import * as phDeployment from './resolvers/phDeployment';
import * as usageReport from './resolvers/usageReport';
import { resolvers as ceResolvers } from '../app';
import { crd as instanceType} from '../resolvers/instanceType';
import { crd as dataset, regenerateUploadSecret} from '../resolvers/dataset';
import { crd as image} from '../resolvers/image';
import { crd as ann} from '../resolvers/announcement';
import Agent, { HttpsAgent } from 'agentkeepalive';
import { ErrorCodes } from '../errorCodes';
import basicAuth from 'basic-auth';
import koaMount from 'koa-mount';
import { OidcTokenVerifier } from '../oidc/oidcTokenVerifier';
import cors from '@koa/cors';
import { JobLogCtrl } from './controllers/jobLogCtrl';
import { PhJobCacheList } from './crdClient/phJobCacheList';
import JobArtifactCleaner from './utils/jobArtifactCleaner';
import { PodLogs } from '../controllers/logCtrl';

// cache
import {
  memGetDataset,
  memGetImage,
  memGetInstanceType,
  addCacheLayerToKc
} from '../cache';

import { CrdCache } from '../cache/crdCache';

// controller
import { AnnCtrl, mount as mountAnn } from '../announcement';

// config
import {createConfig, Config} from '../config';

// observer
import Observer from '../observer/observer';
import Boom from 'boom';

// graphql middlewares
import readOnlyMiddleware from '../middlewares/readonly';
// Basic Auth middleware
import { permissions as authMiddleware } from './middlewares/auth';
import TokenSyncer from '../oidc/syncer';
import K8sSecret from '../k8sResource/k8sSecret';
import K8sDatasetPvc from '../k8sResource/k8sDatasetPvc';
import K8sGroupPvc from '../k8sResource/k8sGroupPvc';

// logger
import * as logger from '../logger';
import { Item } from '../crdClient/customResource';
import K8sUploadServerSecret from '../k8sResource/k8sUploadServerSecret';
import { Role } from '../resolvers/interface';
import Token from '../oidc/token';
import ApiTokenCache from '../oidc/apiTokenCache';
import PersistLog from '../utils/persistLog';
import { createMinioClient } from '../utils/minioClient';

// The GraphQL schema
const typeDefs = gql(importSchema(path.resolve(__dirname, '../graphql/index.graphql')));
// The EE GraphQL schema
const typeDefsEE = gql(importSchema(path.resolve(__dirname, './graphql/ee.graphql')));

const eeResolvers = {
  Query: {
    buildImage: buildImage.queryOne,
    buildImages: buildImage.query,
    buildImagesConnection: buildImage.connectionQuery,
    buildImageJob: buildImageJob.queryOne,
    buildImageJobs: buildImageJob.query,
    buildImageJobsConnection: buildImageJob.connectionQuery,
    phJob: phJob.queryOne,
    phJobs: phJob.query,
    phJobsConnection: phJob.connectionQuery,
    phSchedule: phSchedule.queryOne,
    phSchedules: phSchedule.query,
    phSchedulesConnection: phSchedule.connectionQuery,
    phDeployment: phDeployment.queryOne,
    phDeployments: phDeployment.query,
    phDeploymentsConnection: phDeployment.connectionQuery,
    usageReports: usageReport.query,
    usageReportsConnection: usageReport.connectionQuery,
  },
  Mutation: {
    createBuildImage: buildImage.create,
    updateBuildImage: buildImage.update,
    deleteBuildImage: buildImage.destroy,
    createPhJob: phJob.create,
    rerunPhJob: phJob.rerun,
    cancelPhJob: phJob.cancel,
    cleanupPhJobArtifact: phJob.artifactCleanUp,
    createPhSchedule: phSchedule.create,
    updatePhSchedule: phSchedule.update,
    deletePhSchedule: phSchedule.destroy,
    runPhSchedule: phSchedule.run,
    createPhDeployment: phDeployment.create,
    updatePhDeployment: phDeployment.update,
    deletePhDeployment: phDeployment.destroy,
    deployPhDeployment: phDeployment.deploy,
    stopPhDeployment: phDeployment.stop,
    createPhDeploymentClient: phDeployment.createClient,
    deletePhDeploymentClient: phDeployment.destroyClient,
  },
  BuildImage: buildImage.typeResolvers,
  PhJob: phJob.typeResolvers,
  PhSchedule: phSchedule.typeResolvers,
  PhDeployment: phDeployment.typeResolvers,
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

  // OidcTokenVerifier
  const oidcTokenVerifier = new OidcTokenVerifier({
    issuer
  });
  // init
  await oidcTokenVerifier.initKeystore();

  const createKcAdminClient = (tokenIssuer?: string) => {
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

  // create minio client
  let storeBucket;
  let mClient;
  if (config.enableStore) {
    storeBucket = config.storeBucket;
    mClient = createMinioClient(config.storeEndpoint, config.storeAccessKey, config.storeSecretKey);
  }
  // log
  let persistLog: PersistLog;
  if (config.enableStore && config.enableLogPersistence) {
    persistLog = new PersistLog({
      bucket: storeBucket,
      minioClient: mClient
    });
  }

  const logCtrl = new JobLogCtrl({
    namespace: config.k8sCrdNamespace,
    crdClient,
    appPrefix: config.appPrefix,
    persistLog,
  });

  const podLogs = new PodLogs({
    namespace: config.k8sCrdNamespace
  });

  // job artifact cleaner
  if (config.enableStore) {
    const jobArtifactCleaner = new JobArtifactCleaner(mClient, storeBucket);
    jobArtifactCleaner.start();
  }

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

  // phJob
  const phJobCacheList = new PhJobCacheList(config.k8sCrdNamespace);

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

  // Schema for CE version
  const ceSchema = makeExecutableSchema({
    typeDefs: typeDefs as any,
    resolvers: ceResolvers as any,
  });

  // Schema for EE version
  const eeSchema = makeExecutableSchema({
    typeDefs: typeDefsEE as any,
    resolvers: eeResolvers as any,
  });

  // Merge CE/EE schema
  const schema: any = mergeSchemas({
    schemas: [
      ceSchema,
      eeSchema,
    ],
  });

  const getUserRoleAndKcAdminClient = async (apiToken: string, tokenPayload: any) => {
    let role;
    let kcAdminClient;
    const roles = get(tokenPayload, ['resource_access', 'realm-management', 'roles'], []);
    if (roles.indexOf('realm-admin') >= 0) {
      role = Role.ADMIN;
      kcAdminClient = createKcAdminClient(tokenPayload.iss);
      kcAdminClient.setAccessToken(apiToken);
    } else {
      role = Role.USER;

      // also, we need admin token to access keycloak api
      // this part rely on authMiddleware to control the permission
      // todo: maybe we can use other api to access personal account data?
      const accessToken = await tokenSyncer.getAccessToken();
      kcAdminClient = createKcAdminClient();
      kcAdminClient.setAccessToken(accessToken);
    }
    return [ role, kcAdminClient ];
  };

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

      let kcAdminClient;
      const keycloakClientId = config.keycloakClientId;
      const {authorization = ''}: {authorization: string} = ctx.header;
      const useCache = ctx.headers['x-primehub-use-cache'];
      const isJobClient = ctx.headers['x-primehub-job'];
      const minioClient = mClient;

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
          kcAdminClient = createKcAdminClient();
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
          [role, kcAdminClient] = await getUserRoleAndKcAdminClient(apiToken, tokenPayload);

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

      return {
        realm: config.keycloakRealmName,
        everyoneGroupId: config.keycloakEveryoneGroupId,
        kcAdminClient,
        keycloakClientId,
        crdClient,
        minioClient,
        storeBucket,
        getInstanceType: getInstanceType || memGetInstanceType(crdClient),
        getImage: getImage || memGetImage(crdClient),
        getDataset: memGetDataset(crdClient),
        k8sSecret,
        readOnly,
        userId,
        username,
        role,
        defaultUserVolumeCapacity: config.defaultUserVolumeCapacity,
        crdNamespace: config.k8sCrdNamespace,
        k8sDatasetPvc: datasetPvc,
        k8sGroupPvc: groupPvc,
        k8sUploadServerSecret,
        namespace: config.k8sCrdNamespace,
        appPrefix: config.appPrefix,
        graphqlHost: config.graphqlHost,
        jobLogCtrl: logCtrl,
        phJobCacheList,
        usageReportAPIHost: config.usageReportAPIHost
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

  app.use(views(path.join(__dirname, '../views'), {
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

    let apiToken = authorization.replace('Bearer ', '');

    if (!isEmpty(config.sharedGraphqlSecretKey) && config.sharedGraphqlSecretKey === apiToken) {
      return next();
    } else {
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

      // check if user is admin
      [ctx.role, ctx.kcAdminClient] = await getUserRoleAndKcAdminClient(apiToken, tokenPayload);
      ctx.userId = tokenPayload.sub;
      ctx.username = tokenPayload.preferred_username;
      return next();
    }
  };

  const checkIsAdmin = async (ctx: Koa.ParameterizedContext, next: any) => {
    if (ctx.role === Role.ADMIN) {
      return next();
    }
    throw Boom.forbidden('request not authorized');
  };

  const checkUserGroup = async (ctx: Koa.ParameterizedContext, next: any) => {
    const canUserView = async (userId, groupId): Promise<boolean> => {
      const groups = await ctx.kcAdminClient.users.listGroups({
        id: userId
      });
      const groupIds = groups.map(u => u.id);
      if (groupIds.indexOf(groupId) >= 0) { return true; }
      return false;
    };
    const isGroupBelongUser = async (userId, groupName): Promise<boolean> => {
      const groups = await ctx.kcAdminClient.users.listGroups({
        id: userId
      });
      const groupNames = groups.map(g => g.name);
      if (groupNames.indexOf(groupName) >= 0) { return true; }
      return false;
    };

    let fileDownloadAPIPrefix = `${config.appPrefix || ''}/files/`;
    if (ctx.request.path.startsWith(fileDownloadAPIPrefix)) {
      fileDownloadAPIPrefix = fileDownloadAPIPrefix + 'groups/';
      const groupName = ctx.request.path.split(fileDownloadAPIPrefix).pop().split('/')[0];
      if (!ctx.request.path.startsWith(fileDownloadAPIPrefix) ||
          await isGroupBelongUser(ctx.userId, groupName) === false) {
        throw Boom.forbidden('request not authorized');
      } else {
        return next();
      }
    }

    const namespace = ctx.params.namespace;
    const jobId = ctx.params.jobId || '';
    let resource;
    if (jobId !== '')  {
      // PhJob
      resource = await crdClient.phJobs.get(jobId, namespace);
    } else {
      // PhDeployment
      const podName = ctx.params.podName;
      const pod = await kubeClient.api.v1.namespace(namespace).pods(podName).get();
      const phDeploymentName = pod.body.metadata.labels['primehub.io/phdeployment'] || '';
      if (phDeploymentName === '') { throw Boom.notFound(); }
      resource = await crdClient.phDeployments.get(phDeploymentName, namespace);
    }

    if (resource.spec.groupId === '') {
      throw Boom.notFound();
    }

    if (await canUserView(ctx.userId, resource.spec.groupId) === false) {
      throw Boom.forbidden('request not authorized');
    }

    return next();
  };

  mountAnn(rootRouter, annCtrl);

  // Notebook Log
  rootRouter.get(podLogs.getJupyterHubRoute(), authenticateMiddleware, podLogs.streamJupyterHubLogs);

  // Log Ctrl
  rootRouter.get(logCtrl.getRoute(),
                 authenticateMiddleware, checkIsAdmin,
                 logCtrl.streamLogs);
  rootRouter.get(logCtrl.getPhJobRoute(),
                 authenticateMiddleware, checkUserGroup,
                 logCtrl.streamPhJobLogs);
  rootRouter.get(logCtrl.getPhDeploymentRoute(),
                 authenticateMiddleware, checkUserGroup,
                 logCtrl.streamPhDeploymentLogs);

  // health check
  rootRouter.get('/health', async ctx => {
    ctx.status = 200;
  });

  // usage report
  configureUsageReport(rootRouter,
    config.usageReportAPIHost, '/report/monthly', authenticateMiddleware, checkIsAdmin);
  configureUsageReport(rootRouter,
    config.usageReportAPIHost, '/report/monthly/details', authenticateMiddleware, checkIsAdmin);

  if (config.enableStore) {
    // phfs file download api
    rootRouter.get('/files/(.*)', authenticateMiddleware, checkUserGroup,
      async ctx => {
        const objectPath = decodeURIComponent(ctx.request.path.split('/groups').pop());
        let req;
        try {
          req = await mClient.getObject(storeBucket, `groups${objectPath}`);
        } catch (error) {
          if (error.code === 'NoSuchKey') {
            return ctx.status = 404;
          } else {
            logger.error({
              component: logger.components.internal,
              type: 'MINIO_GET_OBJECT_ERROR',
              code: error.code,
              message: error.message
            });
            ctx.res.end();
          }
        }

        req.on('error', err => {
          logger.error({
            component: logger.components.internal,
            type: 'MINIO_GET_OBJECT_ERROR',
            message: err.message
          });
          ctx.res.end();
        });

        ctx.body = req;

        const mimetype = mime.getType(objectPath);
        ctx.set('Content-type', mimetype);
      }
    );
  }

  app.use(rootRouter.routes());
  server.applyMiddleware({ app, path: config.appPrefix ? `${config.appPrefix}/graphql` : '/graphql' });
  return {app, server, config};
};

function configureUsageReport(rootRouter: Router, host: string, uriPrefix: string,
                              authenticateMiddleware: any, checkIsAdmin: any) {
  rootRouter.get(uriPrefix + '/:year/:month', authenticateMiddleware, checkIsAdmin,
    async ctx => {
      const requestOptions: request.Options = {
        method: 'GET',
        uri: host + uriPrefix + '/' + ctx.params.year + '/' + ctx.params.month,
      };
      kubeConfig.applyToRequest(requestOptions);
      const req = request(requestOptions);

      req.on('error', err => {
        logger.error({
          component: logger.components.internal,
          type: 'USAGE_REPORT_GET_REPORT_ERROR',
          message: err.message
        });
        ctx.res.end();
      });

      ctx.body = req;
    }
  );
}
