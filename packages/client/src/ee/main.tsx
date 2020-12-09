import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {notification, Button} from 'antd';
import {BrowserRouter, Route} from 'react-router-dom';
import {BackgroundTokenSyncer} from '../workers/backgroundTokenSyncer';
import MainPage, { MainPageSidebarItem } from 'containers/mainPage';
import { appPrefix } from 'utils/env';
import { fakeData, schema } from './fakeData';
import { createGraphqlClient } from 'utils/graphqlClient';

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

const client = createGraphqlClient({
  fakeData,
  schema
});

class Main extends React.Component {
  render() {
    const sidebarItems: MainPageSidebarItem[] = [
      {
        title: 'Notebooks',
        subPath: 'hub',
        icon: iconJupyterHub,
        style: {
          width: 'auto',
          height: 22,
          marginRight: '-3px',
          marginLeft: '-2px',
          marginTop: '-2px'
        }
      },
      {
        title: 'Jobs',
        subPath: 'job',
        icon: iconJobs,
        style: {
          width: 'auto',
          height: 17,
          marginLeft: '1px',
          marginRight: '-1px',
          marginTop: '-3px',
        }
      },
      {
        title: 'Schedule',
        subPath: 'schedule',
        icon: iconSchedule,
        style: {
          width: 'auto',
          height: 15,
          marginLeft: '2px',
          marginRight: '-1px',
          marginTop: '-5px',
        }
      },
    ] ;

    if ((window as any).enableModelDeployment) {
      sidebarItems.push(
      {
        title: 'Models',
        subPath: 'model-deployment',
        icon: iconModels,
        stage: 'beta',
        style: {
          width: 'auto',
          height: 16,
          marginLeft: '2px',
          marginRight: '-2px',
          marginTop: '-5px',
        }
      });
    }

    return (
      <BrowserRouter>
        <ApolloProvider client={client}>
          <MainPage sidebarItems={sidebarItems}>
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
          </MainPage>
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
  <Main />
, document.getElementById('root'));
