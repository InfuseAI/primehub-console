import React from 'react';
import ReactDOM from 'react-dom';
import {Alert, Row, Col} from 'antd';
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import CMSPage from './cms';
import Login from './login';

ReactDOM.render(
  <Router>
    <React.Fragment>
      <Switch>
        <Route path="/" exact component={() => (
          <Redirect to={`/cms/`}/>
        )}/>
        <Route path="/cms/:activeKey" component={CMSPage}/>
      </Switch>
    </React.Fragment>
  </Router>
, document.getElementById('main'));

