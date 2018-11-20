import React from 'react';
import ReactDOM from 'react-dom';
import fetch from "isomorphic-fetch"
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import {IntlProvider, addLocaleData} from 'react-intl';
import {LocaleProvider, notification, Button} from 'antd';
import en from 'react-intl/locale-data/en';
import zh from 'react-intl/locale-data/zh';
import zh_TW from 'antd/lib/locale-provider/zh_TW';
import en_US from 'antd/lib/locale-provider/en_US';
import 'moment/locale/zh-tw';
addLocaleData([...en, ...zh])
import CMSPage from './cms';
import schema from '../schema/index.schema.js';
import Login from './login';
import myLocales from './utils/locales';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';
const firstKey = Object.keys(schema.schema)[0];
const locales = {
  zh: zh_TW,
  en: en_US
};
(window as any).LOCALE = (window as any).LOCALE || 'en';
const locale = (window as any).LOCALE;

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
  getNewRefreshToken: () => {
    return fetch(`${(window as any).APP_PREFIX}oidc/refresh-token`, {
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


/**
 * UI
 */
ReactDOM.render(
  <IntlProvider locale={locale} messages={{...schema.dict[locale], ...myLocales[locale]}}>
    <LocaleProvider locale={locales[locale]}>
      <Router>
        <React.Fragment>
          <Switch>
            {/* <Route path="/login" component={Login} /> */}
            <Route path={`${(window as any).APP_PREFIX}cms/:activeKey`} component={CMSPage}/>
            <Redirect to={`${(window as any).APP_PREFIX}cms/${firstKey}`}/>
          </Switch>
        </React.Fragment>
      </Router>
    </LocaleProvider>
  </IntlProvider>
, document.getElementById('root'));

