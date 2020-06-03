import { rule, shield, and, or, not } from 'graphql-shield';
import { Context, Role } from '../resolvers/interface';

const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    return ctx.role === Role.ADMIN;
  },
);

const isUser = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.USER;
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
    'me': or(isAdmin, isUser),
    'user': or(isAdmin, isClient),
    'group': or(isAdmin, isClient),
    'groups': or(isAdmin, isClient),
    'instanceType': or(isAdmin, isClient),
    'phJob': or(isAdmin, isUser),
    'phJobs': or(isAdmin, isUser),
    'phJobsConnection': or(isAdmin, isUser),
    'phSchedule': or(isAdmin, isUser),
    'phSchedules': or(isAdmin, isUser),
    'phSchedulesConnection': or(isAdmin, isUser),
    'phDeployment': or(isAdmin, isUser),
    'phDeployments': or(isAdmin, isUser),
    'phDeploymentsConnection': or(isAdmin, isUser)
  },
  Mutation: {
    '*': isAdmin,
    'createPhJob': or(isAdmin, isUser),
    'rerunPhJob': or(isAdmin, isUser),
    'cancelPhJob': or(isAdmin, isUser),
    'createPhSchedule': or(isAdmin, isUser),
    'updatePhSchedule': or(isAdmin, isUser),
    'deletePhSchedule': or(isAdmin, isUser),
    'runPhSchedule': or(isAdmin, isUser),
    'createPhDeployment': or(isAdmin, isUser),
    'updatePhDeployment': or(isAdmin, isUser),
    'deletePhDeployment': or(isAdmin, isUser),
    'stopPhDeployment': or(isAdmin, isUser),
    'deployPhDeployment': or(isAdmin, isUser),
  },
}, {
  allowExternalErrors: true
});
