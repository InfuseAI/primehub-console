import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {genClient} from 'canner/lib/components/index';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {Layout, notification, Button, Skeleton} from 'antd';
import {BrowserRouter, Router, Route, Switch} from 'react-router-dom';
import Header from 'components/header';
import Sidebar from 'components/hub/sidebar';
import styled from 'styled-components';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';
import {appPrefix} from 'utils/env';
import HubIframe from 'components/hub/iframe';
import ListContainer from './containers/list';
import JobDetailContainer from 'ee/containers/jobDetail';
import JobCreatePage from 'ee/containers/jobCreatePage';
import JobListContainer from 'ee/containers/jobList';
import ScheduleDetailContainer from 'ee/containers/scheduleDetail';
import ScheduleCreatePage from 'ee/containers/scheduleCreatePage';
import ScheduleListContainer from 'ee/containers/scheduleList';
import ModelDeploymentListContainer from 'ee/containers/modelDeploymentList';
import DeploymentDetailContainer from 'ee/containers/deploymentDetail';
import DeploymentCreatePage from 'ee/containers/deploymentCreatePage';
import DeploymentEditPage from 'ee/containers/deploymentEditPage';
import { createBrowserHistory } from 'history';
const HEADER_HEIGHT = 64;

const history = createBrowserHistory();

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
  groups: [{
    id: 'groupId1',
    name: 'Group',
    enabledDeployment: true,
    displayName: 'c-Group 1',
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
    enabledDeployment: true,
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
    enabledDeployment: true,
    displayName: 'DevGru',
    instanceTypes: [{
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    }, {
      id: 'everyone-it2',
      name: 'it',
      displayName: 'gpu1',
      gpuLimit: 1
    }],
    images: [{
      id: 'everyone-image',
      name: 'b-cpu',
      displayName: 'b-cpu',
      type: 'cpu'
    }, {
      id: 'everyone-image2',
      name: 'a-gpu',
      displayName: 'a-gpu',
      type: 'gpu'
    }, {
      id: 'everyone-image3',
      name: 'c-img',
      displayName: 'c-img',
      type: 'both'
    }]
  }]
}

const connector = new LocalStorageConnector({
  defaultData: fakeData,
  localStorageKey: 'infuse-hub'
})

const client = genClient(process.env.NODE_ENV === 'production' ?
  {graphqlClient} :
  {connector, schema: {}});

class Hub extends React.Component {
  onSelectGroup (id) {
    history.push(`${(window as any).APP_PREFIX}console/g/${id}/home`);
  }

  render() {
    return (
      <Router history={history}>
        <Layout>
          <Header
            groups={fakeData.groups}
            onSelectGroup={this.onSelectGroup}
          />
          <Layout>
            <Sidebar />
            <Content>
                <ApolloProvider client={client}>
                  <Switch>
                    <Route path={`${appPrefix}console`} exact>
                      <Skeleton />
                    </Route>
                    <Route path={`${appPrefix}console/g/:groupId/:actionKey`} exact>
                      <Skeleton />
                    </Route>
                    <Route path={`${appPrefix}model-deployment`} exact>
                      <Skeleton />
                    </Route>
                    <Route path={`${appPrefix}job`} exact>
                      <Skeleton />
                    </Route>
                    <Route path={`${appPrefix}schedule`} exact>
                      <Skeleton />
                    </Route>
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
      </Router>
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
