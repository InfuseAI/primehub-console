import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {genClient} from 'canner/lib/components/index';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {notification, Button} from 'antd';
import {BrowserRouter, Route} from 'react-router-dom';
import {BackgroundTokenSyncer} from '../workers/backgroundTokenSyncer';
import Main, { MainPageSidebarItem } from 'containers/mainPage';
import { appPrefix } from 'utils/env';
import {fakeData, schema} from './fakeData';

// Icons
import iconJupyterHub from 'images/icon-jupyterhub.svg'
import iconJobs from 'images/icon-jobs.svg'
import iconSchedule from 'images/icon-schedule.svg'
import iconModels from 'images/icon-models.svg'

// Components
import Jupyterhub from 'containers/jupyterhubPage';
import ListContainer from 'containers/list';
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
  defaultData: fakeData,
  localStorageKey: 'infuse-main'
})

const client = genClient(process.env.NODE_ENV === 'production' ?
  {graphqlClient} :
  {
    connector,
    schema,
  });

class Hub extends React.Component {
  render() {
    const sidebarItems: MainPageSidebarItem[] = [
      {
        title: 'JupyterHub',
        subPath: 'hub',
        icon: iconJupyterHub,
      },
      {
        title: 'Jobs',
        subPath: 'job',
        icon: iconJobs,
        stage: 'beta',
      },
      {
        title: 'Schedule',
        subPath: 'schedule',
        icon: iconSchedule,
        stage: 'beta',
      },
      {
        title: 'Models',
        subPath: 'model-deployment',
        icon: iconModels,
        stage: 'alpha',
      },
    ]

    return (
      <BrowserRouter>
        <ApolloProvider client={client}>
          <Main sidebarItems={sidebarItems}>
            {/* Jupyterhub */}
            <Route path={`${appPrefix}g/:groupName/hub`} exact>
              <Jupyterhub />
            </Route>

            {/* Job Submission */}
            <Route path={`${appPrefix}g/:groupName/job`} exact>
              <ListContainer Com={JobListContainer} />
            </Route>
            <Route path={`${appPrefix}g/:groupName/job/create`} exact>
              <JobCreatePage />
            </Route>
            <Route
              path={`${appPrefix}g/:groupName/job/:jobId`}
              exact
              component={JobDetailContainer}
            />

            {/* Job Scheduler */}
            <Route path={`${appPrefix}g/:groupName/schedule`} exact>
              <ListContainer Com={ScheduleListContainer} />
            </Route>
            <Route path={`${appPrefix}g/:groupName/schedule/create`} exact>
              <ScheduleCreatePage />
            </Route>
            <Route
              path={`${appPrefix}g/:groupName/schedule/:scheduleId`}
              exact
              component={ScheduleDetailContainer}
            />

            {/* Model Deployment */}
            <Route path={`${appPrefix}g/:groupName/model-deployment`} exact>
              <ListContainer Com={ModelDeploymentListContainer} />
            </Route>
            <Route path={`${appPrefix}g/:groupName/model-deployment/create`} exact>
              <DeploymentCreatePage />
            </Route>
            <Route
              path={`${appPrefix}g/:groupName/model-deployment/:deploymentId`}
              exact
              component={DeploymentDetailContainer}
            />
            <Route
              path={`${appPrefix}g/:groupName/model-deployment/:deploymentId/edit`}
              exact
            >
              <DeploymentEditPage />
            </Route>
          </Main>
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
