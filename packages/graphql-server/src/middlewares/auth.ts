import { rule, shield, and, or, not } from 'graphql-shield';
import { Context, Role } from '../resolvers/interface';

const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    return ctx.role === Role.ADMIN;
  },
);

const isJobUser = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.JOB_USER;
  },
);

// from phJob or jupyter client that use secret token
const isClient = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.CLIENT;
  },
);

export const permissions = shield({
  Query: {
    '*': isAdmin,
    'system': or(isAdmin, isClient),
    'me': or(isAdmin, isJobUser),
    'user': or(isAdmin, isClient),
    'group': or(isAdmin, isClient),
    'instanceType': or(isAdmin, isClient),
    'phJob': or(isAdmin, isJobUser),
    'phJobs': or(isAdmin, isJobUser),
    'phJobsConnection': or(isAdmin, isJobUser)
  },
  Mutation: {
    '*': isAdmin,
    'createPhJob': or(isAdmin, isJobUser),
    'rerunPhJob': or(isAdmin, isJobUser),
    'cancelPhJob': or(isAdmin, isJobUser)
  }
});
