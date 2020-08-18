import { genClient } from 'canner/lib/components/index';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import { LocalStorageConnector } from 'canner-graphql-interface';

export const createGraphqlClient = (options: {
  fakeData: any;
  schema: any;
}) => {
  const graphqlClient = new GraphqlClient({
    uri: (window as any).graphqlEndpoint,
    fetch: (uri, options) => {
      const token = window.localStorage.getItem('canner.accessToken');
      options.headers = {
        Authorization: `Bearer ${token}`,
        ...options.headers || {}
      };
      return fetch(uri, options);
    },
  });
  const connector = new LocalStorageConnector({
    defaultData: options.fakeData,
    localStorageKey: 'infuse-main'
  });

  return genClient(process.env.NODE_ENV === 'production' ?
    { graphqlClient } :
    {
      connector,
      schema: options.schema,
    });
}

