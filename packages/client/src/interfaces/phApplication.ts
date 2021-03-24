import {DefaultEnv} from 'interfaces/phAppTemplate';
import Env from 'interfaces/env';

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
}