import Koa from 'koa';
import { ApolloServer, gql } from 'apollo-server-koa';
import { importSchema } from 'graphql-import';
import path from 'path';
import KcAdminClient from 'keycloak-admin/lib';
import views from 'koa-views';
import serve from 'koa-static';
import Router from 'koa-router';

import CrdClient from './crdClient/crdClientImpl';
import * as system from './resolvers/system';
import * as user from './resolvers/user';
import * as group from './resolvers/group';
import { crd as instanceType} from './resolvers/instanceType';
import { crd as dataset} from './resolvers/dataset';
import { crd as image} from './resolvers/image';

// config
import getConfig from './config';

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
};

export const createApp = async (): Promise<{app: Koa, server: ApolloServer}> => {
  const config = getConfig();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async () => {
      const kcAdminClient = new KcAdminClient({
        baseUrl: config.keycloakBaseUrl,
        realmName: config.keycloakRealmName
      });

      await kcAdminClient.auth({
        username: config.keycloakUsername,
        password: config.keycloakPassword,
        clientId: config.keycloakClientId,
        grantType: 'password',
      });

      return {
        realm: config.keycloakRealmName,
        everyoneGroupId: config.keycloakEveryoneGroupId,
        kcAdminClient,
        crdClient: new CrdClient({
          namespace: config.k8sCrdNamespace
        })
      };
    }
  });

  // koa
  const app = new Koa() as any;
  app.use(views(path.join(__dirname, './views'), {
    extension: 'pug'
  }));
  app.use(serve(path.resolve(__dirname, '../../client/dist')));

  // router
  const rootRouter = new Router();
  rootRouter.get('/cms', async ctx => {
    await ctx.render('cms', {title: 'PrimeHub'});
  });
  rootRouter.get('/cms/*', async ctx => {
    await ctx.render('cms', {title: 'PrimeHub'});
  });

  app.use(rootRouter.routes());
  server.applyMiddleware({ app });
  return {app, server};
};
