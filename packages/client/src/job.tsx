import * as React from 'react';
import ReactDOM from 'react-dom';
import {Layout, notification, Button} from 'antd';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import Header from 'components/header';
import styled from 'styled-components';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';
import JobList from 'components/job/list';
import JobDetail from 'components/job/detail';

const PAGE_PADDING = 64;
const HEADER_HEIGHT = 64;

const Content = styled(Layout.Content)`
  margin: ${HEADER_HEIGHT + 24}px ${PAGE_PADDING}px;
  padding: 24;
  min-height: calc(100vh - 64px);
`;

class Job extends React.Component {
  render() {
    return (
      <Layout>
        <Header />
        <Content>
          <BrowserRouter>
            <Switch>
              <Route path="/job" exact>
                <JobList/>
              </Route>
              <Route
                path="/job/:jobId"
                exact
                component={JobDetail}
              />
            </Switch>
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
