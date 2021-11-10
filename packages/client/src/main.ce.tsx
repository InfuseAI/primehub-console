import * as React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { notification, Button } from 'antd';
import { BrowserRouter, Route } from 'react-router-dom';
import { BackgroundTokenSyncer } from './workers/backgroundTokenSyncer';
import MainPage from 'containers/mainPage';
import { appPrefix } from 'utils/env';
import { fakeData, schema } from './fakeData';
import { createGraphqlClient } from 'utils/graphqlClient';
import { listCE } from 'components/Sidebar';

// Components
import Jupyterhub from 'containers/JupyterHubPage';
import ListContainer from 'containers/ListContainer';
import SharedFilesPage from 'containers/sharedFiles/SharedFilesPage';
import AppListContainer from 'containers/AppListContainer';
import AppCreate from 'containers/appCreatePage';
import AppStore from 'containers/appStore';
import AppDetail from 'containers/appDetail';
import AppEdit from 'containers/appEditPage';

import ImageEditPage from 'containers/imageEditPage';
import ImageCreatePage from 'containers/imageCreatePage';
import ImageListContainer from 'containers/imageList';
import GroupSettingsPage from 'containers/groupSettingsPage';
import PageChangeTracker from 'components/share/tracker';

const client = createGraphqlClient({
  fakeData,
  schema,
});

class Main extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <Route path={`${appPrefix}g/`}>
          <ApolloProvider client={client}>
            <MainPage sidebarItems={listCE}>
              {/* Jupyterhub */}
              <Route path={`${appPrefix}g/:groupName/hub`} exact>
                <Jupyterhub />
              </Route>

              {/* Shared Files */}
              <Route path={`${appPrefix}g/:groupName/browse/:phfsPrefix*`}>
                <SharedFilesPage />
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

              {/* Group Settings */}
              <Route path={`${appPrefix}g/:groupName/settings`}>
                <GroupSettingsPage />
              </Route>
            </MainPage>
            <PageChangeTracker />
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

/* tslint:disable:no-console */
tokenSyncWorker.run().catch(console.error);

ReactDOM.render(<Main />, document.getElementById('root'));
