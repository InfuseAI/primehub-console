import * as React from 'react';
import { Route, RouteProps } from 'react-router-dom';

import { GroupNext, GroupNextItem } from '../GroupNext';
import { SystemSetting } from '../SystemSetting';

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
}

export function RouteWithSubRoutes(route) {
  return (
    <Route
      path={route.path}
      render={(props) => <route.component {...props} routes={route.routes} />}
    />
  );
}

export const routes = [
  {
    key: 'group',
    path: '/admin/group',
    name: 'Groups',
    component: GroupNext,
    // FIXME: demo for nested routes
    routes: [
      {
        key: 'group-next',
        path: '/admin/group/:id',
        component: GroupNextItem,
      },
    ],
  },
  {
    key: 'user',
    path: '/admin/user',
    name: 'Users',
    component: () => <div>Users</div>,
  },
  {
    key: 'instanceType',
    path: '/admin/instanceType',
    name: 'Instance Types',
    component: () => <div>Instance Types</div>,
  },
  {
    key: 'image',
    path: '/admin/image',
    name: 'Images',
    component: () => <div>Images</div>,
  },
  {
    key: 'buildImage',
    path: '/admin/buildImage',
    name: 'Image Builder',
    component: () => <div>Image Builder</div>,
  },
  {
    key: 'dataset',
    path: '/admin/dataset',
    name: 'Datasets',
    component: () => <div>Datasets</div>,
  },
  {
    key: 'secret',
    path: '/admin/secret',
    name: 'Secrets',
    component: () => <div>Secrets</div>,
  },
  {
    key: 'jupyterhub',
    path: '/admin/jupyterhub',
    name: 'Notebooks Admin',
    component: () => <div>Notebooks Admin</div>,
  },
  {
    key: 'usageReport',
    path: '/admin/usageReport',
    name: 'Usage Reports',
    component: () => <div>Usage Reports</div>,
  },
  {
    key: 'system',
    path: '/admin/system',
    name: 'System Settings',
    component: SystemSetting,
  },
] as RouteTypes[];
