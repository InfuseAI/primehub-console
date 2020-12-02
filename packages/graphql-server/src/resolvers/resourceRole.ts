import { last } from 'lodash';

// constants
const SEPARATOR = ':';

// todo: move to a better place
export enum ResourceNamePrefix {
  it = 'it',
  ds = 'ds',
  img = 'img'
}

export interface ResourceRole {
  rolePrefix?: string;
  labels?: string[];
  originalName: string;
  resourcePrefix: ResourceNamePrefix;
  resourceName: string;
}

export const parseResourceRole = (keycloakRoleName: string): ResourceRole => {
  // check if rolePrefix exists, or simply starts with resourceName
  const splits = keycloakRoleName.split(SEPARATOR);
  const firstSplit = splits[0];
  const lastSplit = last(splits);
  const resourceName = lastSplit;

  // do not have rolePrefix
  if (ResourceNamePrefix[firstSplit]) {
    const hasLabals = splits.length > 2;
    return {
      rolePrefix: null,
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
    originalName: keycloakRoleName,
    resourcePrefix: null,
    resourceName: null,
  };
};
