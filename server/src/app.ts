import Koa from 'koa';
import { ApolloServer, gql } from 'apollo-server-koa';
import { importSchema } from 'graphql-import';
import path from 'path';
import KcAdminClient from 'keycloak-admin';
import views from 'koa-views';
import serve from 'koa-static';
import Router from 'koa-router';
import CrdClient from './crdClient/crdClientImpl';
import { query as systemQuery } from './resolvers/system';
import * as user from './resolvers/user';
import * as group from './resolvers/group';
import * as machineType from './resolvers/machineType';

// The GraphQL schema
const typeDefs = gql(importSchema(path.resolve(__dirname, './graphql/index.graphql')));

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    system: systemQuery,
    user: user.queryOne,
    users: user.query,
    usersConnection: user.connectionQuery,
    group: group.queryOne,
    groups: group.query,
    groupsConnection: group.connectionQuery,
    machineType: machineType.queryOne,
    machineTypes: machineType.query,
    machineTypesConnection: machineType.connectionQuery
  },
  User: user.typeResolvers,
  Group: group.typeResolvers,
  MachineType: machineType.typeResolvers
};

export const createApp = async (): Promise<{app: Koa, server: ApolloServer}> => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async () => {
      const kcAdminClient = new KcAdminClient();
      await kcAdminClient.auth({
        username: 'wwwy3y3',
        password: 'wwwy3y3',
        grantType: 'password',
        clientId: 'admin-cli'
      });
      return {
        realm: 'master',
        kcAdminClient,
        crdClient: new CrdClient()
      };
    },
    mocks: true
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
    await ctx.render('cms');
  });
  rootRouter.get('/cms/*', async ctx => {
    await ctx.render('cms');
  });

  app.use(rootRouter.routes());
  server.applyMiddleware({ app });
  return {app, server};
};
