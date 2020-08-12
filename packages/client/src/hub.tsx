import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {genClient} from 'canner/lib/components/index';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {Layout, notification, Button, Skeleton} from 'antd';
import {BrowserRouter, Router, Route, Switch} from 'react-router-dom';
import styled from 'styled-components';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';
import Main from 'containers/main';
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

const fakeData = {
  "me": {
    "groups": [
      {
        "id": "927406f6-88b0-490e-8e36-7835224fdf13",
        "displayName": "Dev Team",
        "name": "devteam"
      },
      {
        "id": "e940f720-3fb7-43bf-b24f-f41076fe9d5e",
        "displayName": "InfuseAI",
        "name": "infuseai"
      },
      {
        "id": "ddcbf952-0335-4074-ab52-74ac99a44b52",
        "displayName": "",
        "name": "model-deployment-test-group"
      },
      {
        "id": "bc0dc0e6-04d4-4ab0-a64c-71d298a9c0ad",
        "displayName": null,
        "name": "Project_at100_group1"
      },
      {
        "id": "5a705edf-69a0-4fed-bc39-c54bdace72e8",
        "displayName": "VIP",
        "name": "vip"
      }
    ]
  }
}

const connector = new LocalStorageConnector({
  defaultData: fakeData,
  localStorageKey: 'infuse-hub'
})

const client = genClient(process.env.NODE_ENV === 'production' ?
  {graphqlClient} :
  {connector, schema: {me: {type: 'object'}}});


class Hub extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <ApolloProvider client={client}>
          <Main />
        </ApolloProvider>
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
