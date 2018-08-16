import Koa, {Context} from 'koa';
import { ApolloServer, gql } from 'apollo-server-koa';
import { importSchema } from 'graphql-import';
import path from 'path';
import KcAdminClient from 'keycloak-admin';
import { omit } from 'lodash';
import { Issuer } from 'openid-client';
import views from 'koa-views';
import serve from 'koa-static';
import Router from 'koa-router';
import morgan from 'koa-morgan';
import * as GraphQLJSON from 'graphql-type-json';

import CrdClient from './crdClient/crdClientImpl';
import * as system from './resolvers/system';
import * as user from './resolvers/user';
import * as group from './resolvers/group';
import { crd as instanceType} from './resolvers/instanceType';
import { crd as dataset} from './resolvers/dataset';
import { crd as image} from './resolvers/image';

// controller
import { OidcCtrl, mount as mountOidc } from './oidc';

// config
import getConfig from './config';

// observer
import Observer from './observer/observer';

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
  User: user.typeResolvers,
  Group: group.typeResolvers,
  ...instanceType.typeResolver(),
  ...dataset.typeResolver(),
  ...image.typeResolver(),

  // scalars
  JSON: GraphQLJSON
};

export const createApp = async (): Promise<{app: Koa, server: ApolloServer}> => {
  const config = getConfig();
  // create oidc client and controller
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

  const kcAdminClient = new KcAdminClient({
    baseUrl: config.keycloakApiBaseUrl,
    realmName: config.keycloakRealmName
  });

  const crdClient = new CrdClient({
    namespace: config.k8sCrdNamespace
  });

  // create observer with kc client with password
  if (!process.env.TEST) {
    const kcAdminClientForObserver = new KcAdminClient({
      baseUrl: config.keycloakApiBaseUrl,
      realmName: config.keycloakRealmName
    });
    await kcAdminClientForObserver.auth({
      username: config.keycloakUsername,
      password: config.keycloakPassword,
      clientId: config.keycloakClientId,
      clientSecret: config.keycloakClientSecret,
      grantType: 'password',
    });
    const observer = new Observer({
      crdClient,
      keycloakAdmin: kcAdminClientForObserver,
      everyoneGroupId: config.keycloakEveryoneGroupId
    });
    observer.observe();
  }

  // apollo server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ ctx }) => {
      if (config.keycloakGrantType === 'password') {
        await kcAdminClient.auth({
          username: config.keycloakUsername,
          password: config.keycloakPassword,
          clientId: config.keycloakClientId,
          grantType: 'password',
        });
      } else {
        const accessToken = await oidcCtrl.getAccessToken(ctx);
        kcAdminClient.setAccessToken(accessToken);
      }

      return {
        realm: config.keycloakRealmName,
        everyoneGroupId: config.keycloakEveryoneGroupId,
        kcAdminClient,
        crdClient
      };
    },
    formatError: error => {
      // tslint:disable-next-line:no-console
      console.log(omit(error, 'extensions'));
      if (error.extensions) {
        // tslint:disable-next-line:no-console
        console.log(error.extensions);
      }
      return new Error('Internal server error');
    },
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
      // tslint:disable-next-line:no-console
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
  rootRouter.get('/favicon/*', serve(path.resolve(__dirname, '../static')));

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
