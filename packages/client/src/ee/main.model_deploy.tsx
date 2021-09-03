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
import { listDeploy } from 'components/Sidebar';

// Components
import ListContainer from 'containers/ListContainer';
import SharedFilesPage from 'containers/sharedFiles/sharedFilesPage';
import ModelListContainer from 'ee/containers/modelList';
import ModelDetail from 'ee/containers/ModelDetail';
import ModelVersionDetailContainer from 'ee/containers/modelVersionDetail';
import DeploymentListContainer from 'ee/containers/DeploymentListContainer';
import DeploymentDetailContainer from 'ee/containers/deploymentDetail';
import DeploymentCreatePage from 'ee/containers/deploymentCreatePage';
import DeploymentEditPage from 'ee/containers/deploymentEditPage';
import GroupSettingsPage from 'containers/groupSettingsPage';
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
        <Route path={`${appPrefix}preview/*`}>
          <NotebookViewer appPrefix={appPrefix} />
        </Route>
        <Route path={`${appPrefix}g/`}>
          <ApolloProvider client={client}>
            <MainPage
              sidebarItems={listDeploy}
              notification={<LicenseWarningBanner />}
            >
              {/* Shared Files */}
              <Route path={`${appPrefix}g/:groupName/browse/:phfsPrefix*`}>
                <SharedFilesPage />
              </Route>
              {/* Group Settings */}
              <Route path={`${appPrefix}g/:groupName/settings`}>
                <GroupSettingsPage
                  extraTabs={[
                    {
                      component: GroupSettingsMLflow,
                      key: 'mlflow',
                      tab: 'MLflow',
                    },
                  ]}
                />
              </Route>
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
          type='primary'
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
