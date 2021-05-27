import React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import { fakeData, schema as fakeDataSchema } from '../fakeData';
import { createGraphqlClient } from 'utils/graphqlClient';
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import {IntlProvider, addLocaleData} from 'react-intl';
import {LocaleProvider} from 'antd';
import en from 'react-intl/locale-data/en';
import en_US from 'antd/lib/locale-provider/en_US';
import 'moment/locale/zh-tw';
addLocaleData([...en])
import CMSPage from '../cms';
import schema from 'index-schema';
import myLocales from '../utils/locales';
import {tokenSyncWorker} from '../index';
import LicenseWarningBanner from './components/shared/licenseWarningBanner';
const firstKey = Object.keys(schema.schema)[0];
const locales = {
  en: en_US
};
(window as any).LOCALE = (window as any).LOCALE || 'en';
(window as any).APP_PREFIX = (window as any).APP_PREFIX || '/';
const locale = (window as any).LOCALE;

const client = createGraphqlClient({
  fakeData,
  schema: fakeDataSchema
});

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
            <Route
              path={`${(window as any).APP_PREFIX}cms/:activeKey`}
              component={(props) => <CMSPage {...props} schema={schema} notification={ <ApolloProvider client={client}><LicenseWarningBanner/></ApolloProvider> } />} />
            <Redirect to={`${(window as any).APP_PREFIX}cms/${firstKey}`}/>
          </Switch>
        </React.Fragment>
      </Router>
    </LocaleProvider>
  </IntlProvider>
, document.getElementById('root'));

// @ts-ignore
if (module.hot) module.hot.accept();
