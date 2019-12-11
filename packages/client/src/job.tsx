import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {genClient} from 'canner/lib/components/index';
import schema from '../schema/index.schema.js';
import {Layout, notification, Button} from 'antd';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import Header from 'components/header';
import styled from 'styled-components';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';
import JobContainer from 'containers/job';
import JobDetailContainer from 'containers/jobDetail';

const PAGE_PADDING = 64;
const HEADER_HEIGHT = 64;

const Content = styled(Layout.Content)`
  margin: ${HEADER_HEIGHT + 24}px ${PAGE_PADDING}px;
  padding: 24;
  min-height: calc(100vh - 64px);
`;

const client = genClient(schema);
const appPrefix = (window as any).APP_PREFIX || '/';
class Job extends React.Component {
  render() {
    return (
      <Layout>
        <Header />
        <Content>
          <BrowserRouter>
            <ApolloProvider client={client}>
              <Switch>
                <Route path={`${appPrefix}job`} exact>
                  <JobContainer/>
                </Route>
                <Route
                  path={`${appPrefix}job/:jobId`}
                  exact
                  component={JobDetailContainer}
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
  <Job />
, document.getElementById('root'));
