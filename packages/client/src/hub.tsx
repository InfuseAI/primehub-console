import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {genClient} from 'canner/lib/components/index';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {Layout, notification, Button} from 'antd';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import Header from 'components/header';
import Sidebar from 'components/hub/sidebar';
import styled from 'styled-components';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';
import {appPrefix} from 'utils/env';
import HubIframe from 'components/hub/iframe';
const HEADER_HEIGHT = 64;

const Content = styled(Layout.Content)`
  margin-top: ${HEADER_HEIGHT}px;
  padding: 24;
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

const fakeData = {}

const connector = new LocalStorageConnector({
  defaultData: fakeData,
  localStorageKey: 'infuse-hub'
})

const client = genClient(process.env.NODE_ENV === 'production' ?
  {graphqlClient} :
  {connector, schema: {}});

class Hub extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <Layout>
          <Header />
          <Layout>
            <Sidebar />
            <Content>
                <ApolloProvider client={client}>
                  <Switch>
                    <Route
                      path={`${appPrefix}hub/phusers`}
                      exact
                      render={(props) => (
                        <HubIframe {...props} src="/hub/primehub/home?group=phusers"></HubIframe>
                      )}
                    />
                    <Route
                      path={`${appPrefix}hub/test`}
                      exact
                      render={(props) => (
                        <HubIframe {...props} src="/hub/primehub/home?group=test"></HubIframe>
                      )}
                    />
                    <Route
                      path={`${appPrefix}hub/admin`}
                      exact
                      render={(props) => (
                        <HubIframe {...props} src="/hub/admin"></HubIframe>
                      )}
                    />
                  </Switch>
                </ApolloProvider>
            </Content>
          </Layout>
        </Layout>
      </BrowserRouter>
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
  <Hub />
, document.getElementById('root'));
