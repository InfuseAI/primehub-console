import 'setimmediate';
import { createHttpLink } from 'apollo-link-http';
import { isEmpty, isPlainObject } from 'lodash';
import {
  createClient,
  LocalStorageConnector,
  MemoryConnector,
} from 'canner-graphql-interface';

class GraphqlClient {
  private uri;
  private headers;
  private includeExtensions;
  private fetch;
  private credentials;
  private fetchOptions;
  private useGETForQueries;
  constructor({
    uri,
    headers,
    fetch,
    includeExtensions,
    credentials,
    fetchOptions,
    useGETForQueries,
  }: {
    uri: string;
    headers?: any;
    fetch?: any;
    includeExtensions?: boolean;
    credentials?: string;
    fetchOptions?: any;
    useGETForQueries?: boolean;
  }) {
    this.uri = uri;
    this.headers = headers;
    this.fetch = fetch;
    this.includeExtensions = includeExtensions;
    this.credentials = credentials;
    this.fetchOptions = fetchOptions;
    this.useGETForQueries = useGETForQueries;
  }
  createLink() {
    return createHttpLink({
      uri: this.uri,
      headers: this.headers,
      fetch: this.fetch,
      includeExtensions: this.includeExtensions,
      credentials: this.credentials,
      fetchOptions: this.fetchOptions,
      useGETForQueries: this.useGETForQueries,
    });
  }
}

interface LoadedSchema {
  connector?: any;
  graphqlClient?: any;
  resolvers?: any;
  schema?: any;
}

export function genClient(schema: LoadedSchema, fakeData: any) {
  const { resolvers, connector, graphqlClient } = schema;

  const options: any = {
    schema: schema.schema,
  };

  if (connector) {
    if (isPlainObject(connector)) {
      if (!isEmpty(connector)) {
        options.connectors = connector;
      }
    } else {
      options.connector = connector;
    }
  }

  if (graphqlClient) {
    if (isPlainObject(graphqlClient)) {
      if (!isEmpty(connector)) {
        options.graphqlClients = graphqlClient;
      }
    } else {
      options.graphqlClient = graphqlClient;
    }
  }

  if (isEmpty(connector) && isEmpty(graphqlClient)) {
    options.connector = new MemoryConnector({
      defaultData: createFakeData(schema.schema, 10),
    });
  }

  if (!isEmpty(resolvers)) {
    options.resolvers = resolvers;
  }
  return createClient(options);
}

export const createGraphqlClient = (options: { fakeData: any }) => {
  const graphqlClient = new GraphqlClient({
    uri: window.graphqlEndpoint,
    fetch: (uri, option) => {
      const token = window.localStorage.getItem('primehub.accessToken');
      option.headers = {
        Authorization: `Bearer ${token}`,
        'x-primehub-use-cache': true,
        ...(option.headers || {}),
      };
      return fetch(uri, option);
    },
  });
  const connector = new LocalStorageConnector({
    defaultData: options.fakeData,
    localStorageKey: 'infuse-main',
  });

  return genClient(
    process.env.NODE_ENV === 'production'
      ? { graphqlClient }
      : {
          connector,
          schema: {},
        },
    options.fakeData
  );
};
