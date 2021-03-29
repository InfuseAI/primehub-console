import {DefaultEnv} from 'interfaces/phAppTemplate';
import PhAppTemplate from './phAppTemplate';
import Env from 'interfaces/env';
import gql from 'graphql-tag';

export enum PhAppStatus {
  Ready = 'Ready',
  Error = 'Error',
  Updating = 'Updating',
  Stopping = 'Stopping',
  Starting = 'Starting',
  Stopped = 'Stopped',
}

export enum PhAppScope {
  Public = 'public',
  PrimeHubUserOnly = 'primehub',
  GroupOnly = 'group'
}

export default interface PhApplication {
  id: string;
  displayName: string;
  appName: string;
  appVersion: string;
  appIcon: string;
  appDefaultEnv: DefaultEnv[];
  appTemplate: PhAppTemplate;
  groupName: string;
  instanceType: any;
  scope: PhAppScope;
  appUrl: string;
  internalAppUrl: string;
  svcEndpoint: string[];
  env: Env[];
  stop: boolean;
  status: PhAppStatus;
  message: string;
  pods: string[];
}

export const PhApplicationFragment = gql`
fragment PhApplicationInfo on PhApplication {
  id
  displayName
  appVersion
  appName
  appIcon
  appDefaultEnv {
    name
    defaultValue
    optional
  }
  groupName
  instanceType
  scope
  appUrl
  internalAppUrl
  svcEndpoints
  env {
    name
    value
  }
  stop
  status
  message
  pods {
    logEndpoint
  }
}
`;
