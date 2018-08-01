import Koa from 'koa';
import { ApolloServer, gql } from 'apollo-server-koa';
import { importSchema } from 'graphql-import';
import path from 'path';
import KcAdminClient from 'keycloak-admin/lib';
import CrdClient from './crdClient/crdClientImpl';
import * as system from './resolvers/system';
import * as user from './resolvers/user';
import * as group from './resolvers/group';
import { crd as instanceType} from './resolvers/instanceType';
import { crd as dataset} from './resolvers/dataset';
import { crd as image} from './resolvers/image';

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
    ...image.resolvers(),
  },
  Mutation: {
    updateSystem: system.update,
    createUser: user.create,
    updateUser: user.update,
    deleteUser: user.destroy,
    createGroup: group.create,
    updateGroup: group.update,
    deleteGroup: group.destroy
  },
  User: user.typeResolvers,
  Group: group.typeResolvers,
  ...instanceType.typeResolver(),
  ...dataset.typeResolver(),
  ...image.typeResolver(),
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
    // mocks: true
  });

  // koa
  const app = new Koa() as any;
  server.applyMiddleware({ app });
  return {app, server};
};
