import { shield, or } from 'graphql-shield';
import { ShieldMutation, ShieldQuery } from '../../middlewares/auth';
import { isAdmin, isClient, isUser, isGroupAdmin, isGroupMember } from '../../utils/roles';

export const permissions = shield({
  Query: {
    ...ShieldQuery,
    phJob: or(isAdmin, isUser),
    phJobs: or(isAdmin, isUser),
    phJobsConnection: or(isAdmin, isUser),
    phSchedule: or(isAdmin, isUser),
    phSchedules: or(isAdmin, isUser),
    phSchedulesConnection: or(isAdmin, isUser),
    phDeployment: or(isAdmin, isUser),
    phDeploymentAvail: or(isAdmin, isUser),
    phDeployments: or(isAdmin, isUser),
    phDeploymentsConnection: or(isAdmin, isUser),
    license: or(isAdmin, isUser),
    files: or(isAdmin, isUser),
    mlflow: or(isAdmin, isGroupMember),
    mlflowRuns: or(isAdmin, isGroupMember),
    mlflowArtifact: or(isAdmin, isGroupMember),
    model: or(isAdmin, isGroupMember),
    models: or(isAdmin, isGroupMember),
    modelVersion: or(isAdmin, isGroupMember),
    modelVersions: or(isAdmin, isGroupMember),
    modelVersionsConnection: or(isAdmin, isGroupMember),
    invitation: or(isClient, isAdmin),
  },
  Mutation: {
    ...ShieldMutation,
    createPhJob: or(isAdmin, isUser),
    rerunPhJob: or(isAdmin, isUser),
    cancelPhJob: or(isAdmin, isUser),
    notifyPhJobEvent: or(isClient),
    createPhSchedule: or(isAdmin, isUser),
    updatePhSchedule: or(isAdmin, isUser),
    deletePhSchedule: or(isAdmin, isUser),
    runPhSchedule: or(isAdmin, isUser),
    createPhDeployment: or(isAdmin, isUser),
    updatePhDeployment: or(isAdmin, isUser),
    deletePhDeployment: or(isAdmin, isUser),
    stopPhDeployment: or(isAdmin, isUser),
    deployPhDeployment: or(isAdmin, isUser),
    registerModel: or(isAdmin, isGroupMember),
  },
}, {
  allowExternalErrors: true
});
