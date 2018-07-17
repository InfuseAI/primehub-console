import Koa from 'koa';
import { ApolloServer, gql } from 'apollo-server-koa';

// The GraphQL schema
const typeDefs = gql`
  type Query {
    "A simple type for getting started!"
    hello: String
  }
`;

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => 'world'
  }
};

export const createApp = async (): Promise<{app: Koa, server: ApolloServer}> => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // koa
  const app = new Koa() as any;
  server.applyMiddleware({ app });
  return {app, server};
};
