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
    'phJob': or(isAdmin, isJobUser),
    'phJobs': or(isAdmin, isJobUser),
    'phJobsConnection': or(isAdmin, isJobUser),
    'phSchedule': or(isAdmin, isJobUser),
    'phSchedules': or(isAdmin, isJobUser),
    'phSchedulesConnection': or(isAdmin, isJobUser),
    'phDeployment': or(isAdmin, isJobUser),
    'phDeployments': or(isAdmin, isJobUser),
    'phDeploymentsConnection': or(isAdmin, isJobUser)
  },
  Mutation: {
    '*': isAdmin,
    'createPhJob': or(isAdmin, isJobUser),
    'rerunPhJob': or(isAdmin, isJobUser),
    'cancelPhJob': or(isAdmin, isJobUser),
    'createPhSchedule': or(isAdmin, isJobUser),
    'updatePhSchedule': or(isAdmin, isJobUser),
    'deletePhSchedule': or(isAdmin, isJobUser),
    'runPhSchedule': or(isAdmin, isJobUser),
    'createPhDeployment': or(isAdmin, isJobUser),
    'updatePhDeployment': or(isAdmin, isJobUser),
    'deletePhDeployment': or(isAdmin, isJobUser),
    'stopPhDeployment': or(isAdmin, isJobUser),
    'deployPhDeployment': or(isAdmin, isJobUser),
  }
});
