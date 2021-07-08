import * as React from 'react';
import { Route, RouteProps } from 'react-router-dom';

// import { GroupNext, GroupNextItem } from '../GroupNext';
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
    component: () => <div />,
    // FIXME: demo for nested routes
    routes: [
      {
        key: 'group-next',
        path: '/admin/group/:id',
        component: () => <div />,
      },
    ],
  },
  {
    key: 'user',
    path: '/admin/user',
    name: 'Users',
    component: () => <div />,
  },
  {
    key: 'instanceType',
    path: '/admin/instanceType',
    name: 'Instance Types',
    component: () => <div />,
  },
  {
    key: 'image',
    path: '/admin/image',
    name: 'Images',
    component: () => <div />,
  },
  {
    key: 'buildImage',
    path: '/admin/buildImage',
    name: 'Image Builder',
    component: () => <div />,
  },
  {
    key: 'dataset',
    path: '/admin/dataset',
    name: 'Datasets',
    component: () => <div />,
  },
  {
    key: 'secret',
    path: '/admin/secret',
    name: 'Secrets',
    component: () => <div />,
  },
  {
    key: 'jupyterhub',
    path: 'admin/jupyterhub',
    name: 'Notebooks Admin',
    component: () => <div />,
  },
  {
    key: 'usageReport',
    path: '/admin/usageReport',
    name: 'Usage Reports',
    component: () => <div />,
  },
  {
    key: 'system',
    path: '/admin/system',
    name: 'System Settings',
    component: SystemSetting,
  },
] as RouteTypes[];
