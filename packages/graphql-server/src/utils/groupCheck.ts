export const isGroupBelongUser = async (ctx: any, userId: string, groupName: string): Promise<boolean> => {
    const groups = await ctx.kcAdminClient.users.listGroups({
      id: userId
    });
    groupName = groupName.toLowerCase();
    const groupNames = groups.map(g => g.name.toLowerCase());
    if (groupNames.indexOf(groupName) >= 0) { return true; }
    return false;
  };

export const toGroupPath = (groupName: string) =>
  groupName.replace(/_/g, '-').toLowerCase();
