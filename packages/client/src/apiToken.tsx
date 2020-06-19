import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {genClient} from 'canner/lib/components/index';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {LocalStorageConnector} from 'canner-graphql-interface';
import { Layout, Breadcrumb, Icon, Button, notification } from 'antd';
import Header from 'components/header';
import styled from 'styled-components';
import PageTitle from 'components/pageTitle';

// @ts-ignore

import { appPrefix } from 'utils/env';
import ApiTokenPage from 'containers/apiTokenPage';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';

const HEADER_HEIGHT = 64;

const Content = styled(Layout.Content)`
  margin-top: ${HEADER_HEIGHT}px;
  padding: 64px;
  min-height: calc(100vh - 64px);
`;

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
  defaultData: {me:{apiTokenCount: 1}},
  localStorageKey: 'infuse-api-token'
})

const client = genClient(process.env.NODE_ENV === 'production' ?
  {graphqlClient} :
  {connector, schema: {me: {type: 'object'}}});

const ApiTokenBreadCrumb = () => {
  return (
    <Breadcrumb style={{ marginBottom: 8 }}>
      <Breadcrumb.Item key="home">
        <a href={`${appPrefix}`}>
          <Icon type="home" />
        </a>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        API Token
      </Breadcrumb.Item>
    </Breadcrumb>
  );
}

class ApiToken extends React.Component {
  render() {
    return (
      <Layout>
        <Header />
        <Layout>
          <Content style={{ padding: 0 }}>
              <PageTitle
                  breadcrumb={<ApiTokenBreadCrumb />}
                  title={"API Token"}
                  style={{ paddingLeft: 64 }}
              />
              <ApolloProvider client={client}>
                <ApiTokenPage />
              </ApolloProvider>
          </Content>
        </Layout>

      </Layout>
    )
  }
}

/**
 * Background worker
 */
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    (error as any).response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

const tokenSyncWorker = new BackgroundTokenSyncer({
  appPrefix: (window as any).APP_PREFIX,
  refreshTokenExp: (window as any).refreshTokenExp,
  accessTokenExp: (window as any).accessTokenExp,
  getNewTokenSet: () => {
    return fetch(`${(window as any).APP_PREFIX}oidc/refresh-token-set`, {
      method: 'POST'
    })
    .then(checkStatus)
    .then(parseJSON);
  },
  reLoginNotify: ({loginUrl}) => {
    // notify with fixed card
    notification.warning({
      message: 'Warning',
      description: 'In less than 1 minute, you\'re going to be redirected to login page.',
      placement: 'bottomRight',
      duration: null,
      btn: (
        <Button type="primary" onClick={() => window.location.replace(`${(window as any).APP_PREFIX}oidc/logout`)}>
          Login Again
        </Button>
      ),
      key: 'refreshWarning'
    });
  }
})
tokenSyncWorker.run().catch(console.error);

// render
ReactDOM.render(
  <ApiToken />
  , document.getElementById('root'));
