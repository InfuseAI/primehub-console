import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {notification, Button} from 'antd';
import {BrowserRouter, Route} from 'react-router-dom';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';
import MainPage, { MainPageSidebarItem } from 'containers/mainPage';
import { appPrefix } from 'utils/env';
import { fakeData, schema } from './fakeData';
import { createGraphqlClient } from 'utils/graphqlClient';



// Icons
import iconJupyterHub from 'images/icon-jupyterhub.svg'
import iconImages from 'images/icon-images.png';
import iconShareFiles from 'images/icon-files.svg';

// Components
import Jupyterhub from 'containers/jupyterhubPage';
import ListContainer from 'containers/list';
import SharedFilesPage from 'containers/sharedFiles/sharedFilesPage';

import ImageEditPage from 'containers/imageEditPage';
import ImageCreatePage from 'containers/imageCreatePage';
import ImageListContainer from 'containers/imageList';


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
        title: 'Shared Files',
        subPath: 'browse',
        icon: iconShareFiles,
        style: {
          width: 'auto',
          height: 17,
          marginLeft: '3px',
          marginRight: '-1px',
          marginTop: '-3px',
        }
      },
    ];

    // Group Admin Only
    sidebarItems.push(
      {
        title: 'Images',
        subPath: 'images',
        icon: iconImages,
        groupAdminOnly: true,
        style: {
          width: 'auto',
          height: 17,
          marginLeft: '1px',
          marginRight: '-1px',
          marginTop: '-3px',
        }
      },
    );

    return (
      <BrowserRouter>
        <ApolloProvider client={client}>
          <MainPage sidebarItems={sidebarItems}>
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
