export const isGroupBelongUser = async (ctx: any, userId: string, groupName: string): Promise<boolean> => {
    const groups = await ctx.kcAdminClient.users.listGroups({
      id: userId
    });
    const groupNames = groups.map(g => g.name.toLowerCase());
    if (groupNames.indexOf(groupName) >= 0) { return true; }
    return false;
  };
