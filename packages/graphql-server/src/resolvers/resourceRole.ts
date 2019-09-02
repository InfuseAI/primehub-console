
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
  originalName: string;
  resourcePrefix: ResourceNamePrefix;
  resourceName: string;
}

export const parseResourceRole = (keycloakRoleName: string): ResourceRole => {
  // check if rolePrefix exists, or simply starts with resourceName
  const splits = keycloakRoleName.split(SEPARATOR);
  const firstSplit = splits[0];

  if (ResourceNamePrefix[firstSplit]) {
    return {
      rolePrefix: null,
      originalName: keycloakRoleName,
      resourcePrefix: ResourceNamePrefix[firstSplit],
      resourceName: splits.slice(1).join(SEPARATOR),
    };
  }

  // starts from a word in ResourceNamePrefix
  // the secondSplit would be rolePrefix
  const secondSplit = splits[1];
  if (ResourceNamePrefix[secondSplit]) {
    return {
      rolePrefix: firstSplit,
      originalName: keycloakRoleName,
      resourcePrefix: ResourceNamePrefix[secondSplit],
      resourceName: splits.slice(2).join(SEPARATOR),
    };
  }

  // a self-defined keycloak role
  return {
    rolePrefix: null,
    originalName: keycloakRoleName,
    resourcePrefix: null,
    resourceName: null,
  };
};
