import { rule, shield, and, or, not } from 'graphql-shield';
import { Context, Role } from '../resolvers/interface';

const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    return ctx.role === Role.ADMIN;
  },
);

const isJupyterUser = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.JUPYTER_USER;
  },
);

const isJobUser = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.JOB_USER;
  },
);

export const permissions = shield({
  Query: {
    '*': isAdmin,
    'me': or(isAdmin, isJobUser),
    'user': or(isAdmin, isJupyterUser),
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
