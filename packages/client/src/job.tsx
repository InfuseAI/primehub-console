import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {genClient} from 'canner/lib/components/index';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {Layout, notification, Button} from 'antd';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import Header from 'components/header';
import styled from 'styled-components';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';
import JobContainer from 'containers/job';
import JobDetailContainer from 'containers/jobDetail';
import JobCreatePage from 'containers/jobCreatePage';

const PAGE_PADDING = 64;
const HEADER_HEIGHT = 64;

const Content = styled(Layout.Content)`
  margin: ${HEADER_HEIGHT + 24}px ${PAGE_PADDING}px;
  padding: 24;
  min-height: calc(100vh - 64px);
`;

const graphqlClient = new GraphqlClient({
  uri: (window as any).graphqlEndpoint,
  fetch: (uri, options) => {
    const token = window.localStorage.getItem('canner.accessToken');
    options.headers = {
      Authorization: `Bearer ${token}`,
      'x-primehub-job': true,
      ...options.headers || {}
    };
    return fetch(uri, options);
  },
});

const fakeData = {
  me: {
    groups: [{
      id: 'groupId1',
      name: 'Group',
      displayName: 'Group 1',
      instanceTypes: [{
        id: 'g-it1',
        name: 'IT1',
        displayName: 'group1 it'
      }],
      images: [{
        id: 'g-it1',
        name: 'IT1',
        displayName: 'group1 im',
      }]
    }, {
      id: 'groupId2',
      name: 'Group',
      displayName: 'Group 2',
      instanceTypes: [{
        id: 'ggit1',
        name: 'IT1',
        displayName: 'group2 it'
      }],
      images: [{
        id: 'ggit2',
        name: 'IT1',
        displayName: 'group2 im',
      }]
    }, {
      id: 'everyone',
      name: 'Group',
      displayName: 'Group DisplayName',
      instanceTypes: [{
        id: 'everyone-it',
        name: 'it',
        displayName: 'gpu0',
        gpuLimit: 0
      }, {
        id: 'everyone-it2',
        name: 'it',
        displayName: 'gpu1',
        gpuLimit: 1
      }],
      images: [{
        id: 'everyone-image',
        name: 'cpu',
        displayName: 'cpu',
        type: 'cpu'
      }, {
        id: 'everyone-image2',
        name: 'gpu',
        displayName: 'gpu',
        type: 'gpu'
      }, {
        id: 'everyone-image3',
        name: 'img',
        displayName: 'img',
        type: 'only'
      }]
    }]
  },
  phJobs: [{
    id: 'it1',
    name: 'IT1',
    displayName: 'IT1',
    phase: 'Running',
    message: 'Job Complete',
    createTime: '2019-10-04T14:48:00.000Z',
    startTime: '2019-10-04T14:48:00.000Z',
    finishTime: '2019-10-04T15:47:00.000Z',
  }, {
    id: 'it2',
    name: 'IT2',
    displayName: 'IT2',
    phase: 'Failed',
    reason: 'Your instance type resource limit is bigger your user or group quota'
  }, {
    id: 'it3',
    name: 'IT3',
    displayName: 'IT3',
    phase: 'Failed',
    message: `Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
    File "<stdin>", line 3, in divide
  TypeError: unsupported operand type(s) for /: 'str' and 'str'`
  }, {
    id: 'it4',
    name: 'IT4',
    displayName: 'IT4',
    phase: 'Failed',
    message: `Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
    File "<stdin>", line 3, in divide
  TypeError: unsupported operand type(s) for /: 'str' and 'str'TypeError: unsupported operand type(s) for /: 'str' and 'str'`
  }, {
    id: 'it5',
    name: 'IT5',
    displayName: 'IT5',
    phase: 'Cancelled',
    message: `Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
    File "<stdin>", line 3, in divide
  TypeError: unsupported operand type(s) for /: 'str' and 'str'TypeError: unsupported operand type(s) for /: 'str' and 'str'`
  }]
}

const connector = new LocalStorageConnector({
  defaultData: fakeData,
  localStorageKey: 'infuse-job'
})

const client = genClient(process.env.NODE_ENV === 'production' ?
  {graphqlClient} :
  {connector, schema: {me: {type: 'object'}, phJobs: {type: 'array',items: {type: 'object'}}}});
const appPrefix = (window as any).APP_PREFIX || '/';
class Job extends React.Component {
  render() {
    return (
      <Layout>
        <Header />
        <Content>
          <BrowserRouter>
            <ApolloProvider client={client}>
              <Switch>
                <Route path={`${appPrefix}job`} exact>
                  <JobContainer/>
                </Route>
                <Route path={`${appPrefix}job/create`} exact>
                  <JobCreatePage />
                </Route>
                <Route
                  path={`${appPrefix}job/:jobId`}
                  exact
                  component={JobDetailContainer}
                />
              </Switch>
            </ApolloProvider>
          </BrowserRouter>
        </Content>
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
  <Job />
, document.getElementById('root'));
