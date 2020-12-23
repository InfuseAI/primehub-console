import { rule, shield, and, or, not } from 'graphql-shield';
import { isAdmin, isGroupAdmin, isClient, isUser } from '../../utils/roles';

export const permissions = shield({
  Query: {
    '*': isAdmin,
    'system': or(isAdmin, isClient),
    'me': or(isAdmin, isUser),
    'user': or(isAdmin, isClient),
    'group': or(isAdmin, isClient),
    'groups': or(isAdmin, isClient),
    'image': or(isAdmin, isGroupAdmin, isUser, isClient),
    'images': or(isAdmin, isGroupAdmin, isUser, isClient),
    'imagesConnection': or(isAdmin, isGroupAdmin, isUser, isClient),
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
    'revokeApiToken': or(isAdmin, isUser),
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
    'createGroupImage': isGroupAdmin,
    'updateGroupImage': isGroupAdmin,
    'deleteGroupImage': isGroupAdmin,
  },
}, {
  allowExternalErrors: true
});
