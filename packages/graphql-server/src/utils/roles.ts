import { rule } from 'graphql-shield';
import Boom from 'boom';
import { Context, Role } from '../resolvers/interface';
import { get, find } from 'lodash';

const getCurrentGroup = async (args, ctx) => {
  const currentGroupName = get(args, 'data.groupName', null);
  const groups = await ctx.kcAdminClient.groups.find({max: 99999});
  const groupData = find(groups, ['name', currentGroupName]);
  return ctx.kcAdminClient.groups.findOne({id: get(groupData, 'id', '')});
};

export const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    return ctx.role === Role.ADMIN;
  },
);

export const isUser = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.USER;
  },
);

// from phJob or jupyter client that use secret token
export const isClient = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.CLIENT;
  },
);

export const isGroupAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    const currentGroup = await getCurrentGroup(args, ctx);
    const admins = get(currentGroup, 'attributes.admins', []);
    const valid = admins.includes(ctx.username);
    return valid;
  },
);
