import * as logger from '../logger';

export const isGroupBelongUser = async (ctx: any, userId: string, groupName: string): Promise<boolean> => {
    const groups = await ctx.kcAdminClient.users.listGroups({
      id: userId
    });
    groupName = groupName.toLowerCase();
    const groupNames = groups.map(g => toGroupPath(g.name));
    if (groupNames.indexOf(groupName) >= 0) { return true; }

    // show validation input and the white list
    logger.warn({validator: 'isGroupBelongUser', args: {group: groupName, validGroupNames: groupNames}});
    return false;
  };

export const toGroupPath = (groupName: string) =>
  groupName.replace(/_/g, '-').toLowerCase();
