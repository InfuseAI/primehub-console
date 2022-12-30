import { rule } from 'graphql-shield';
import { Context, Role } from '../resolvers/interface';
import { keycloakMaxCount } from '../resolvers/constant';
import { get, find } from 'lodash';

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

export const isGroupAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    const groupId = args.where && args.where.id;
    if (!groupId) return false;
    const group = await ctx.kcAdminClient.groups.findOne({id: groupId});
    const admins = group && group.attributes && group.attributes.admins || [];
    return (admins.indexOf(ctx.username) >= 0);
  },
);

export const isGroupMemberByGroupId = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    const groupId = args.where && args.where.id;
    if (!groupId) return false;
    const group = await ctx.kcAdminClient.groups.findOne({id: groupId});
    if (!group) return false;
    const members = await ctx.kcAdminClient.groups.listMembers({
      id: get(group, 'id', ''),
      max: keycloakMaxCount
    });
    const memberIds = members.map(user => user.id);
    return (memberIds.indexOf(ctx.userId) >= 0);
  },
);

export const isGroupMember = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    const groupName = args.where && (args.where.group || args.where.groupName);
    const groups = await ctx.kcAdminClient.groups.find({max: keycloakMaxCount});
    const group = find(groups, ['name', groupName]);
    if (!group) {
      // false if group not found
      return false;
    }
    const members = await ctx.kcAdminClient.groups.listMembers({
      id: get(group, 'id', ''),
      max: keycloakMaxCount
    });
    const memberIds = members.map(user => user.id);
    return (memberIds.indexOf(ctx.userId) >= 0);
  },
);

// from phJob or jupyter client that use secret token
export const isClient = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.CLIENT;
  },
);
