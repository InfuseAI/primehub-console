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
import ListContainer from 'containers/list';
import ScheduleDetailContainer from 'containers/scheduleDetail';
import ScheduleCreatePage from 'containers/scheduleCreatePage';
import ScheduleListContainer from 'containers/scheduleList';

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
  },
  phSchedules: [{
    id: 'it1',
    name: 'IT1',
    displayName: 'IT1',
    nextRunTime: '2019-12-26T14:24:22Z',
    jobTemplate: {
      spec: {
        command: 'haha',
        displayName: 'hello',
        userId: 'userId',
        userName: 'phadmin',
        groupName: 'groupName',
        image: 'image name',
        instanceType: 'evergds'
      }
    },
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    }
  }]
}

const connector = new LocalStorageConnector({
  defaultData: fakeData,
  localStorageKey: 'infuse-schedule'
})

const client = genClient(process.env.NODE_ENV === 'production' ?
  {graphqlClient} :
  {connector, schema: {me: {type: 'object'}, phSchedules: {type: 'array',items: {type: 'object'}}}});
const appPrefix = (window as any).APP_PREFIX || '/';

class Schedule extends React.Component {
  render() {
    return (
      <Layout>
        <Header />
        <Content>
          <BrowserRouter>
            <ApolloProvider client={client}>
              <Switch>
                <Route path={`${appPrefix}schedule`} exact>
                  <ListContainer Com={ScheduleListContainer} />
                </Route>
                <Route path={`${appPrefix}schedule/create`} exact>
                  <ScheduleCreatePage />
                </Route>
                <Route
                  path={`${appPrefix}schedule/:scheduleId`}
                  exact
                  component={ScheduleDetailContainer}
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
  <Schedule />
, document.getElementById('root'));
