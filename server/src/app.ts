import Koa from 'koa';
import { ApolloServer, gql } from 'apollo-server-koa';
import { importSchema } from 'graphql-import';
import path from 'path';

// The GraphQL schema
const typeDefs = gql(importSchema(path.resolve(__dirname, './graphql/index.graphql')));

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => 'world'
  }
};

export const createApp = async (): Promise<{app: Koa, server: ApolloServer}> => {
  const server = new ApolloServer({
    typeDefs,
    // resolvers,
    mocks: true
  });

  // koa
  const app = new Koa() as any;
  server.applyMiddleware({ app });
  return {app, server};
};
