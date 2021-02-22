import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {notification, Button} from 'antd';
import {BrowserRouter, Route} from 'react-router-dom';
import {BackgroundTokenSyncer} from '../workers/backgroundTokenSyncer';
import MainPage, { MainPageSidebarItem } from 'containers/mainPage';
import { appPrefix } from 'utils/env';
import { fakeData, schema } from '../fakeData';
import { createGraphqlClient } from 'utils/graphqlClient';

// Icons
import iconModels from 'images/icon-models.svg'
import iconShareFiles from 'images/icon-files.svg';

// Components
import ListContainer from 'containers/list';
import SharedFilesPage from 'containers/sharedFiles/sharedFilesPage';
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
        title: 'Models',
        subPath: 'model-deployment',
        icon: iconModels,
        style: {
          width: 'auto',
          height: 16,
          marginLeft: '2px',
          marginRight: '-2px',
          marginTop: '-5px',
        }
      },
      {
        title: 'Shared Files',
        subPath: 'browse',
        icon: iconShareFiles,
        style: {
          width: 'auto',
          height: 17,
          marginLeft: '1px',
          marginRight: '-1px',
          marginTop: '-3px',
        }
      },
    ];

    return (
      <BrowserRouter>
        <ApolloProvider client={client}>
          <MainPage sidebarItems={sidebarItems}>
            {/* Shared Files */}
            <Route path={`${appPrefix}g/:groupName/browse/:phfsPrefix*`}>
              <SharedFilesPage />
            </Route>
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
