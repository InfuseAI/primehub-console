import Koa from 'koa';
import { ApolloServer, gql } from 'apollo-server-koa';
import { importSchema } from 'graphql-import';
import path from 'path';
import KcAdminClient from 'keycloak-admin/lib';
import CrdClient from './crdClient/crdClientImpl';
import { query as systemQuery } from './resolvers/system';
import * as user from './resolvers/user';
import * as group from './resolvers/group';
import * as instanceType from './resolvers/instanceType';

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
    instanceType: instanceType.queryOne,
    instanceTypes: instanceType.query,
    instanceTypesConnection: instanceType.connectionQuery
  },
  User: user.typeResolvers,
  Group: group.typeResolvers,
  InstanceType: instanceType.typeResolvers
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
  server.applyMiddleware({ app });
  return {app, server};
};
