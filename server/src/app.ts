// tslint:disable:no-console
import Koa, {Context} from 'koa';
import stringify from 'json-stringify-safe';
import { ApolloServer, gql, ApolloError } from 'apollo-server-koa';
import { importSchema } from 'graphql-import';
import path from 'path';
import KcAdminClient from 'keycloak-admin';
import { omit, get, isEmpty } from 'lodash';
import { Issuer } from 'openid-client';
import views from 'koa-views';
import serve from 'koa-static';
import Router from 'koa-router';
import morgan from 'koa-morgan';
import * as GraphQLJSON from 'graphql-type-json';
import { makeExecutableSchema } from 'graphql-tools';
import { applyMiddleware } from 'graphql-middleware';

import CrdClient from './crdClient/crdClientImpl';
import * as system from './resolvers/system';
import * as user from './resolvers/user';
import * as group from './resolvers/group';
import { crd as instanceType} from './resolvers/instanceType';
import { crd as dataset} from './resolvers/dataset';
import { crd as image} from './resolvers/image';
import Agent, { HttpsAgent } from 'agentkeepalive';
import { ErrorCodes } from './errorCodes';
import basicAuth from 'basic-auth';

// controller
import { OidcCtrl, mount as mountOidc } from './oidc';

// config
import {createConfig} from './config';

// observer
import Observer from './observer/observer';
import Boom from 'boom';

// graphql middlewares
import readOnlyMiddleware from './middlewares/readonly';

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
    resetPassword: user.resetPassword,
    createGroup: group.create,
    updateGroup: group.update,
    deleteGroup: group.destroy,
    ...instanceType.resolveInMutation(),
    ...dataset.resolveInMutation(),
    ...image.resolveInMutation()
  },
  System: {
    email: system.queryEmail
  },
  User: user.typeResolvers,
  Group: group.typeResolvers,
  ...instanceType.typeResolver(),
  ...dataset.typeResolver(),
  ...image.typeResolver(),

  // scalars
  JSON: GraphQLJSON
};

export const createApp = async (): Promise<{app: Koa, server: ApolloServer}> => {
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
  Issuer.defaultHttpOptions = {
    agent: {
      http: httpAgent,
      https: httpsAgent
    }
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
    grantType: config.keycloakGrantType
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
      getAccessToken: async () => oidcCtrl.clientCredentialGrant()
    });
    observer.observe();
  }

  // apollo server
  const schema = makeExecutableSchema({
    typeDefs: typeDefs as any,
    resolvers
  });
  const schemaWithMiddleware = applyMiddleware(schema, readOnlyMiddleware);
  const server = new ApolloServer({
    debug: true,
    schema: schemaWithMiddleware as any,
    context: async ({ ctx }: { ctx: Koa.Context }) => {
      let readOnly = false;
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

        // use service account token and put on readonly mode
        readOnly = true;
        const accessToken = await oidcCtrl.clientCredentialGrant();
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

      return {
        realm: config.keycloakRealmName,
        everyoneGroupId: config.keycloakEveryoneGroupId,
        kcAdminClient,
        crdClient,
        readOnly
      };
    },
    formatError: error => {
      console.log(`== http agent ==`);
      console.log(httpAgent.getCurrentStatus());
      console.log(`== https agent ==`);
      console.log(httpsAgent.getCurrentStatus());

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
      console.log(`Error Code: ${errorCode}`);
      console.log(get(exception, 'stacktrace', []).join('\n'));

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
        return ctx.render('403', {message: err.message});
      } else {
        ctx.body = {code: errorCode, message: err.message};
      }
    }
  });

  if (!process.env.TEST) {
    app.use(morgan('combined'));
  }

  app.use(views(path.join(__dirname, './views'), {
    extension: 'pug'
  }));
  app.use(serve(path.resolve(__dirname, '../../client/dist')));

  // router
  const rootRouter = new Router();

  // favicon
  const serveStatic = serve(path.resolve(__dirname, '../static'), {maxage: 86400000});
  rootRouter.get('/favicon/*', serveStatic);
  rootRouter.get('/js/*', serveStatic);
  rootRouter.get('/font/*', serveStatic);

  // ctrl
  mountOidc(rootRouter, oidcCtrl);

  // cms
  rootRouter.get('/cms', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('cms', {title: 'PrimeHub'});
  });
  rootRouter.get('/cms/*', oidcCtrl.ensureAdmin, async ctx => {
    await ctx.render('cms', {title: 'PrimeHub'});
  });
  app.use(rootRouter.routes());
  server.applyMiddleware({ app });
  return {app, server};
};
