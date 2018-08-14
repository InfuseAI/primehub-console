import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import {IntlProvider} from 'react-intl';
import CMSPage from './cms';
import schema from '../schema/index.schema.js';
import Login from './login';
const firstKey = Object.keys(schema.schema)[0];

(window as any).LOCALE = (window as any).LOCALE || 'en';

ReactDOM.render(
  <IntlProvider locale={(window as any).LOCALE} messages={schema.dict[(window as any).LOCALE]}>
    <Router>
      <React.Fragment>
        <Switch>
          {/* <Route path="/login" component={Login} /> */}
          <Route path="/cms/:activeKey" component={CMSPage}/>
          <Redirect to={`/cms/${firstKey}`}/>
        </Switch>
      </React.Fragment>
    </Router>
  </IntlProvider>
, document.getElementById('root'));

