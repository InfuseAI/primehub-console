import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import CMSPage from './cms';
import schema from '../schema/index.schema.js';
import Login from './login';
const firstKey = Object.keys(schema.schema)[0];

ReactDOM.render(
  <Router>
    <React.Fragment>
      <Switch>
        {/* <Route path="/login" component={Login} /> */}
        <Route path="/cms/:activeKey" component={CMSPage}/>
        <Redirect to={`/cms/${firstKey}`}/>
      </Switch>
    </React.Fragment>
  </Router>
, document.getElementById('root'));

