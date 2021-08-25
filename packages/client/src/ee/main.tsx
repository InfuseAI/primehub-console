import * as React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { notification, Button } from 'antd';
import { BrowserRouter, Route } from 'react-router-dom';
import { BackgroundTokenSyncer } from '../workers/backgroundTokenSyncer';
import MainPage from 'containers/mainPage';
import { appPrefix } from 'utils/env';
import { fakeData, schema } from '../fakeData';
import { createGraphqlClient } from 'utils/graphqlClient';
import LicenseWarningBanner from 'ee/components/shared/licenseWarningBanner';
import { listEE } from 'components/Sidebar';

// Components
import Jupyterhub from 'containers/JupyterHubPage';
import ListContainer from 'containers/ListContainer';
import SharedFilesPage from 'containers/sharedFiles/sharedFilesPage';
import JobDetailContainer from 'ee/containers/jobDetail';
import JobCreatePage from 'ee/containers/jobCreatePage';
import JobListContainer from 'ee/containers/JobListContainer';
import ScheduleDetailContainer from 'ee/containers/scheduleDetail';
import ScheduleCreatePage from 'ee/containers/ScheduleCreatePage';
import ScheduleListContainer from 'ee/containers/scheduleList';
import ModelListContainer from 'ee/containers/modelList';
import ModelDetail from 'ee/containers/ModelDetail';
import ModelVersionDetailContainer from 'ee/containers/modelVersionDetail';
import DeploymentListContainer from 'ee/containers/DeploymentListContainer';
import DeploymentDetailContainer from 'ee/containers/deploymentDetail';
import DeploymentCreatePage from 'ee/containers/deploymentCreatePage';
import DeploymentEditPage from 'ee/containers/deploymentEditPage';
import ImageEditPage from 'containers/imageEditPage';
import ImageCreatePage from 'containers/imageCreatePage';
import ImageListContainer from 'containers/imageList';
import AppListContainer from 'containers/AppListContainer';
import AppCreate from 'containers/appCreatePage';
import AppStore from 'containers/appStore';
import AppDetail from 'containers/appDetail';
import AppEdit from 'containers/appEditPage';
import GroupSettingsPage from 'containers/groupSettingsPage';
import GroupSettingsJobs from 'ee/components/groupSettings/jobs';
import GroupSettingsDeployments from 'ee/components/groupSettings/deployments';
import GroupSettingsMLflow from 'ee/components/groupSettings/mlflow';
import NotebookViewer from 'containers/sharedFiles/notebookViewer';

const client = createGraphqlClient({
  fakeData,
  schema,
});

class Main extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <Route path={`${appPrefix}preview`}>
          <NotebookViewer />
        </Route>

        <Route path={`${appPrefix}g/`}>
          <ApolloProvider client={client}>
          <MainPage
            sidebarItems={listEE}
            notification={<LicenseWarningBanner />}
          >
            {/* Jupyterhub */}
            <Route path={`${appPrefix}g/:groupName/hub`} exact>
              <Jupyterhub />
            </Route>

            {/* Shared Files */}
            <Route path={`${appPrefix}g/:groupName/browse/:phfsPrefix*`}>
              <SharedFilesPage />
            </Route>
            <Route path={`${appPrefix}g/:groupName/view/notebook`}>
            <NotebookViewer />
            </Route>
            <Route path={`${appPrefix}view/notebook`}>
              <NotebookViewer />
            </Route>

            {/* Group Images management*/}
            <Route path={`${appPrefix}g/:groupName/images`} exact>
              <ListContainer Com={ImageListContainer} />
            </Route>
            <Route path={`${appPrefix}g/:groupName/images/create`} exact>
              <ImageCreatePage />
            </Route>
            <Route
              path={`${appPrefix}g/:groupName/images/:imageId/edit`}
              exact
              component={ImageEditPage}
            />

            {/* Group Settings */}
            <Route path={`${appPrefix}g/:groupName/settings`}>
              <GroupSettingsPage
                extraTabs={[
                  { component: GroupSettingsJobs, key: 'jobs', tab: 'Jobs' },
                  {
                    component: GroupSettingsDeployments,
                    key: 'deployments',
                    tab: 'Deployments',
                  },
                  {
                    component: GroupSettingsMLflow,
                    key: 'mlflow',
                    tab: 'MLflow',
                  },
                ]}
              />
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

            {/* Model Management */}
            <Route path={`${appPrefix}g/:groupName/models`} exact>
              <ListContainer Com={ModelListContainer} />
            </Route>
            <Route
              path={`${appPrefix}g/:groupName/models/:modelName`}
              exact
              component={ModelDetail}
            />
            <Route
              path={`${appPrefix}g/:groupName/models/:modelName/versions/:version`}
              exact
              component={ModelVersionDetailContainer}
            />

            {/* Model Deployment */}
            <Route path={`${appPrefix}g/:groupName/deployments`} exact>
              <ListContainer Com={DeploymentListContainer} />
            </Route>
            <Route path={`${appPrefix}g/:groupName/deployments/create`} exact>
              <DeploymentCreatePage />
            </Route>
            <Route
              path={`${appPrefix}g/:groupName/deployments/:deploymentId`}
              exact
              component={DeploymentDetailContainer}
            />
            <Route
              path={`${appPrefix}g/:groupName/deployments/:deploymentId/edit`}
              exact
            >
              <DeploymentEditPage />
            </Route>

            {/* Apps */}
            <Route path={`${appPrefix}g/:groupName/apps`} exact>
              <ListContainer Com={AppListContainer} />
            </Route>
            <Route
              path={`${appPrefix}g/:groupName/apps/store`}
              exact
              component={AppStore}
            />
            <Route
              path={`${appPrefix}g/:groupName/apps/create`}
              exact
              component={AppCreate}
            />
            <Route
              path={`${appPrefix}g/:groupName/apps/create/:templateId`}
              exact
              component={AppCreate}
            />
            <Route
              path={`${appPrefix}g/:groupName/apps/:appId`}
              exact
              component={AppDetail}
            />
            <Route
              path={`${appPrefix}g/:groupName/apps/:appId/edit`}
              exact
              component={AppEdit}
            />
          </MainPage>
        </ApolloProvider>
        </Route>

      </BrowserRouter>
    );
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
  appPrefix: window.APP_PREFIX,
  refreshTokenExp: window.refreshTokenExp,
  accessTokenExp: window.accessTokenExp,
  getNewTokenSet: () => {
    return fetch(`${window.APP_PREFIX}oidc/refresh-token-set`, {
      method: 'POST',
    })
      .then(checkStatus)
      .then(parseJSON);
  },
  reLoginNotify: () => {
    // notify with fixed card
    notification.warning({
      message: 'Warning',
      description:
        "In less than 1 minute, you're going to be redirected to login page.",
      placement: 'bottomRight',
      duration: null,
      btn: (
        // @ts-ignore
        <Button
          type="primary"
          onClick={() =>
            window.location.replace(`${window.APP_PREFIX}oidc/logout`)
          }
        >
          Login Again
        </Button>
      ),
      key: 'refreshWarning',
    });
  },
});
tokenSyncWorker.run().catch(console.error);

// render
ReactDOM.render(<Main />, document.getElementById('root'));
