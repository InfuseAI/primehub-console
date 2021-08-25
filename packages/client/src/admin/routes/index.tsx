import * as React from 'react';
import { Route, RouteProps } from 'react-router-dom';
import { SystemSetting } from '../SystemSetting';
import { UserList, UserDetail, UserAdd } from '../User';
import { Datasets, DatasetInfo } from '../Datasets';
import GroupList from '../Group/GroupList';
import GroupAdd from '../Group/GroupAdd';
import GroupUpdate from '../Group/GroupUpdate';
import { Secrets, SecretInfo } from '../Secrets';
import { InstanceTypes, InstanceTypeInfo } from '../InstanceTypes';
import { appPrefix } from 'utils/env';
import UsageReport from '../UsageReport';

export const ROUTES = [
  'group',
  'group_next',
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
  enabled?: boolean;
}

export function RouteWithSubRoutes(route) {
  if (!route.component || !route.enabled) {
    return;
  }

  return (
    <Route
      path={`${appPrefix}${route.path}`}
      exact
      render={props => <route.component {...props} />}
    />
  );
}

export const routes = [
  {
    key: 'group',
    path: 'admin/group',
    name: 'Groups',
  },
  {
    key: 'group_next',
    path: 'admin/group_next',
    name: 'Groups (Next)',
    enabled: true,
    component: GroupList,
  },
  {
    key: 'group_next_add',
    path: 'admin/group_next/add',
    enabled: true,
    component: GroupAdd,
  },
  {
    key: 'group_next_update',
    path: 'admin/group_next/:id',
    enabled: true,
    component: GroupUpdate,
  },
  {
    key: 'user',
    path: 'admin/user',
    name: 'Users',
    enabled: true,
    component: UserList,
  },
  {
    key: 'user_add',
    path: 'admin/user/add',
    enabled: true,
    component: UserAdd,
  },
  {
    key: 'user_detail',
    path: 'admin/user/:id',
    enabled: true,
    component: UserDetail,
  },
  {
    key: 'instanceType',
    path: 'admin/instanceType',
    name: 'Instance Types',
    enabled: true,
    component: InstanceTypes,
  },
  {
    key: 'instanceType-id',
    path: 'admin/instanceType/:id',
    name: 'Instance Type',
    enabled: true,
    component: InstanceTypeInfo,
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
    enabled: true,
    name: 'Datasets',
    exact: true,
    component: Datasets,
  },
  {
    key: 'dataset-id',
    path: 'admin/dataset/:id',
    enabled: true,
    name: 'Datasets',
    component: DatasetInfo,
  },
  {
    key: 'secret',
    path: 'admin/secret',
    name: 'Secrets',
    exact: true,
    enabled: true,
    component: Secrets,
  },
  {
    key: 'secret-id',
    name: 'Secret',
    path: 'admin/secret/:id',
    enabled: true,
    component: SecretInfo,
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
    enabled: window.enableUsageReport,
  },
  {
    key: 'system',
    path: 'admin/system',
    name: 'System Settings',
    enabled: true,
    component: SystemSetting,
  },
] as RouteTypes[];
