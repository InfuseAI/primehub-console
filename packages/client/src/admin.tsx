import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { fakeData } from './fakeData';
import { createGraphqlClient } from 'utils/graphqlClient';
import { dict } from 'schema/utils';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';
import { IntlProvider, addLocaleData } from 'react-intl';
import { LocaleProvider, notification, Button } from 'antd';
import en from 'react-intl/locale-data/en';
import en_US from 'antd/lib/locale-provider/en_US';
import 'moment/locale/zh-tw';
addLocaleData([...en]);
import CMSPage from './cms';
import myLocales from './utils/locales';
import { BackgroundTokenSyncer } from './workers/backgroundTokenSyncer';
import PageChangeTracker from 'components/share/tracker';

const locales = {
  en: en_US,
};
const locale = window.LOCALE || 'en';
const appPrefix = window.APP_PREFIX || '/';

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

export const tokenSyncWorker = new BackgroundTokenSyncer({
  appPrefix,
  refreshTokenExp: window.refreshTokenExp,
  accessTokenExp: window.accessTokenExp,
  getNewTokenSet: () => {
    return fetch(`${appPrefix}oidc/refresh-token-set`, {
      method: 'POST',
    })
      .then(checkStatus)
      .then(parseJSON);
  },
  reLoginNotify: () => {
    // notify with fixed card
    notification.warning({
      message: 'Warning',
      description: `In less than 1 minute, you're going to be redirected to login page.`,
      placement: 'bottomRight',
      duration: null,
      btn: (
        // @ts-ignore
        <Button
          type='primary'
          onClick={() => window.location.replace(`${appPrefix}oidc/logout`)}
        >
          Login Again
        </Button>
      ),
      key: 'refreshWarning',
    });
  },
});

const client = createGraphqlClient({
  fakeData,
});

tokenSyncWorker.run().catch(console.error);
/**
 * UI
 */
ReactDOM.render(
  <IntlProvider
    locale={locale}
    messages={{ ...dict[locale], ...myLocales[locale] }}
  >
    <LocaleProvider locale={locales[locale]}>
      <Router>
        <React.Fragment>
          <Switch>
            <Route
              path={`${appPrefix}admin/:activeKey`}
              component={props => (
                <CMSPage
                  {...props}
                  notification={<ApolloProvider client={client} {...props} />}
                />
              )}
            />
            <Redirect
              exact
              from={`${appPrefix}admin/`}
              to={`${appPrefix}admin/group`}
            />
          </Switch>
        </React.Fragment>
        <PageChangeTracker />
      </Router>
    </LocaleProvider>
  </IntlProvider>,
  document.getElementById('root')
);

// @ts-ignore
if (module.hot) module.hot.accept();
