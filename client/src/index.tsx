import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import {IntlProvider, addLocaleData} from 'react-intl';
import {LocaleProvider} from 'antd';
import en from 'react-intl/locale-data/en';
import zh from 'react-intl/locale-data/zh';
import zh_TW from 'antd/lib/locale-provider/zh_TW';
import en_US from 'antd/lib/locale-provider/en_US';
import 'moment/locale/zh-tw';
addLocaleData([...en, ...zh])
import CMSPage from './cms';
import schema from '../schema/index.schema.js';
import Login from './login';
const firstKey = Object.keys(schema.schema)[0];
const locales = {
  zh: zh_TW,
  en: en_US
};
(window as any).LOCALE = (window as any).LOCALE || 'en';
const locale = (window as any).LOCALE;
ReactDOM.render(
  <IntlProvider locale={locale} messages={schema.dict[locale]}>
    <LocaleProvider locale={locales[locale]}>
      <Router>
        <React.Fragment>
          <Switch>
            {/* <Route path="/login" component={Login} /> */}
            <Route path="/cms/:activeKey" component={CMSPage}/>
            <Redirect to={`/cms/${firstKey}`}/>
          </Switch>
        </React.Fragment>
      </Router>
    </LocaleProvider>
  </IntlProvider>
, document.getElementById('root'));

