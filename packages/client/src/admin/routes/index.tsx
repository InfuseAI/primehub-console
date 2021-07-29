import * as React from 'react';
import styled from 'styled-components';
import { Route, RouteProps } from 'react-router-dom';

import { SystemSetting } from '../SystemSetting';
import { UserList, UserDetail, UserAdd } from '../User';
import { appPrefix } from 'utils/env';
import { UsageReport } from '../UsageReport';

const Badge = styled.span`
  position: absolute;
  top: 12px;
  left: 140px;
  border-radius: 2px;
  padding: 0px 5px;
  line-height: 15px;
  background: none;
  border: 1px rgb(255, 255, 255, 0.5) solid;
  font-size: 10px;

  .ant-menu-item:hover &,
  .ant-menu-item-selected & {
    border-color: #fff;
  }
`;

export const ROUTES = [
  'group',
  'user',
  'instanceType',
  'image',
  'buildImage',
  'dataset',
  'secret',
  'jupyterhub',
  'usageReport',
  'system',
] as const;

export type ROUTE_KEYS = typeof ROUTES[number];
export interface RouteTypes extends RouteProps {
  key: ROUTE_KEYS;
  name: string;
  routes?: RouteTypes[];
  visible?: boolean;
}

export function RouteWithSubRoutes(route) {
  if (!route.component || !route.visible) {
    return;
  }

  return (
    <Route
      path={`${appPrefix}${route.path}`}
      exact
      render={(props) => <route.component {...props} routes={route.routes} />}
    />
  );
}

export const routes = [
  {
    key: 'group',
    path: 'admin/group',
    name: 'Groups',
    // FIXME: demo for nested routes
    routes: [
      {
        key: 'group-next',
        path: 'admin/group/:id',
      },
    ],
  },
  {
    key: 'users_next',
    path: 'admin/users_next',
    name: (
      <span>
        Users <Badge>next</Badge>
      </span>
    ),
    component: UserList,
  },
  {
    key: 'user_next_add',
    path: 'admin/user_next/add',
    component: UserAdd,
  },
  {
    key: 'user_next',
    path: 'admin/user_next/:id',
    component: UserDetail,
  },
  {
    key: 'user',
    path: 'admin/user',
    name: 'Users',
  },
  {
    key: 'instanceType',
    path: 'admin/instanceType',
    name: 'Instance Types',
  },
  {
    key: 'image',
    path: 'admin/image',
    name: 'Images',
  },
  {
    key: 'buildImage',
    path: 'admin/buildImage',
    name: 'Image Builder',
  },
  {
    key: 'dataset',
    path: 'admin/dataset',
    name: 'Datasets',
  },
  {
    key: 'secret',
    path: 'admin/secret',
    name: 'Secrets',
  },
  {
    key: 'jupyterhub',
    path: 'admin/jupyterhub',
    name: 'Notebooks Admin',
  },
  {
    key: 'usageReport',
    path: 'admin/usageReport',
    name: 'Usage Reports',
    component: UsageReport,
    visible: window.enableUsageReport,
  },
  {
    key: 'system',
    path: 'admin/system',
    name: 'System Settings',
    component: SystemSetting,
  },
] as RouteTypes[];
