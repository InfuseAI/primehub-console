import { defaultWorkspaceId } from './constant';
import { last } from 'lodash';

// constants
const SEPARATOR = ':';
const WORKSPACE_SEP = '|';

// todo: move to a better place
export enum ResourceNamePrefix {
  it = 'it',
  ds = 'ds',
  img = 'img'
}

export interface ResourceRole {
  rolePrefix?: string;
  labels?: string[];
  workspaceId: string;
  originalName: string;
  resourcePrefix: ResourceNamePrefix;
  resourceName: string;
}

export const parseResourceRole = (keycloakRoleName: string): ResourceRole => {
  // check if rolePrefix exists, or simply starts with resourceName
  const splits = keycloakRoleName.split(SEPARATOR);
  const firstSplit = splits[0];
  const lastSplit = last(splits);

  // check if workspace exists
  const workspaceSplits = lastSplit.split(WORKSPACE_SEP);
  const hasWorkspace = workspaceSplits.length > 1;

  // parse workspaceId & resourceName out
  const workspaceId = hasWorkspace ? workspaceSplits[0] : defaultWorkspaceId;
  const resourceName = hasWorkspace ? workspaceSplits[1] : workspaceSplits[0];

  // do not have rolePrefix
  if (ResourceNamePrefix[firstSplit]) {
    const hasLabals = splits.length > 2;
    return {
      rolePrefix: null,
      workspaceId,
      labels: hasLabals ? splits.slice(1, -1) : null,
      originalName: keycloakRoleName,
      resourcePrefix: ResourceNamePrefix[firstSplit],
      resourceName,
    };
  }

  // starts from a word in ResourceNamePrefix
  // the secondSplit would be rolePrefix
  const secondSplit = splits[1];
  if (ResourceNamePrefix[secondSplit]) {
    const hasLabals = splits.length > 3;
    return {
      rolePrefix: firstSplit,
      workspaceId,
      labels: hasLabals ? splits.slice(2, -1) : null,
      originalName: keycloakRoleName,
      resourcePrefix: ResourceNamePrefix[secondSplit],
      resourceName,
    };
  }

  // a self-defined keycloak role
  return {
    rolePrefix: null,
    labels: null,
    workspaceId: null,
    originalName: keycloakRoleName,
    resourcePrefix: null,
    resourceName: null,
  };
};
