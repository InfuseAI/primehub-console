import GroupRepresentation from 'keycloak-admin/lib/defs/groupRepresentation';
import * as logger from '../logger';

export const isGroupBelongUser = async (ctx: any, userId: string, groupName: string): Promise<boolean> => {
  const groups = await ctx.kcAdminClient.users.listGroups({
    id: userId
  });
  const groupNames = groups.map(g => toGroupPath(g.name));
  if (groupNames.indexOf(toGroupPath(groupName)) >= 0) { return true; }

  // show validation input and the white list
  logger.warn({ validator: 'isGroupBelongUser', args: { group: groupName, validGroupNames: groupNames } });
  return false;
};

export const toGroupPath = (groupName: string) =>
  groupName.replace(/_/g, '-').toLowerCase();

export const isGroupNameAvailable = (groupName: string, groupList: GroupRepresentation[]) => {
  const groupNames = groupList.map(g => toGroupPath(g.name));
  const available = groupNames.indexOf(toGroupPath(groupName)) === -1;
  if (!available) {
    logger.warn({ validator: 'isGroupNameAvailable', args: { group: groupName, existingGroupNames: groupNames } });
  }
  return available;
};
