// TODO: Remove this file, just for demo

import * as React from 'react';
import { Switch, Link, useParams } from 'react-router-dom';

import { RouteWithSubRoutes } from '../routes';

export function GroupNextItem() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <p>Group ID: {id}</p>
      <Link to="/admin/group">
        <p>Back to Group</p>
      </Link>
    </div>
  );
}

export function GroupNext({ routes }) {
  return (
    <div>
      <h1>Group</h1>
      <Link to="/admin/group/123">123</Link>

      <Switch>
        {routes.map((route) => (
          <RouteWithSubRoutes key={route.key} {...route} />
        ))}
      </Switch>
    </div>
  );
}
