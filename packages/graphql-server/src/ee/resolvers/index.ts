import path from 'path';
import * as system from '../../resolvers/system';
import * as license from './license';
import * as buildImage from './buildImage';
import * as buildImageJob from './buildImageJob';
import * as phJob from './phJob';
import * as phSchedule from './phSchedule';
import * as phDeployment from './phDeployment';
import * as usageReport from './usageReport';
import * as model from './model';
import * as GraphQLJSON from 'graphql-type-json';
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools';
import { gql } from 'apollo-server';
import { importSchema } from 'graphql-import';
import { resolvers as ceResolvers } from '../../resolvers';
import { registerGroupDeletionCallback } from '../../resolvers/group';

const eeResolvers = {
  Query: {
    system: system.query,
    buildImage: buildImage.queryOne,
    buildImages: buildImage.query,
    buildImagesConnection: buildImage.connectionQuery,
    buildImageJob: buildImageJob.queryOne,
    buildImageJobs: buildImageJob.query,
    buildImageJobsConnection: buildImageJob.connectionQuery,
    phJob: phJob.queryOne,
    phJobs: phJob.query,
    phJobsConnection: phJob.connectionQuery,
    phSchedule: phSchedule.queryOne,
    phSchedules: phSchedule.query,
    phSchedulesConnection: phSchedule.connectionQuery,
    phDeployment: phDeployment.queryOne,
    phDeploymentAvail: phDeployment.available,
    phDeployments: phDeployment.query,
    phDeploymentsConnection: phDeployment.connectionQuery,
    usageReports: usageReport.query,
    usageReportsConnection: usageReport.connectionQuery,
    license: license.query,
    mlflow: model.queryMLflow,
    model: model.queryOne,
    models: model.query,
    modelVersion: model.queryVersion,
    modelVersions: model.queryVersions,
    modelVersionsConnection: model.connectionQueryVersions,
  },
  Mutation: {
    createBuildImage: buildImage.create,
    updateBuildImage: buildImage.update,
    deleteBuildImage: buildImage.destroy,
    createPhJob: phJob.create,
    rerunPhJob: phJob.rerun,
    cancelPhJob: phJob.cancel,
    notifyPhJobEvent: phJob.notifyJobEvent,
    cleanupPhJobArtifact: phJob.artifactCleanUp,
    createPhSchedule: phSchedule.create,
    updatePhSchedule: phSchedule.update,
    deletePhSchedule: phSchedule.destroy,
    runPhSchedule: phSchedule.run,
    createPhDeployment: phDeployment.create,
    updatePhDeployment: phDeployment.update,
    deletePhDeployment: phDeployment.destroy,
    deployPhDeployment: phDeployment.deploy,
    stopPhDeployment: phDeployment.stop,
    createPhDeploymentClient: phDeployment.createClient,
    deletePhDeploymentClient: phDeployment.destroyClient,
  },
  System: {
    smtp: system.querySmtp,
    license: system.queryLicense,
  },
  BuildImage: buildImage.typeResolvers,
  PhJob: phJob.typeResolvers,
  PhSchedule: phSchedule.typeResolvers,
  PhDeployment: phDeployment.typeResolvers,
  // scalars
  JSON: GraphQLJSON
};

// Schema for CE version
const ceSchema = makeExecutableSchema({
  typeDefs: gql(importSchema(path.resolve(__dirname, '../../graphql/index.graphql'))),
  resolvers: ceResolvers as any,
});

// Schema for EE version
const eeSchema = makeExecutableSchema({
  typeDefs: gql(importSchema(path.resolve(__dirname, '../graphql/ee.graphql'))),
  resolvers: eeResolvers as any,
});

// Merge CE/EE schema
export const schema: any = mergeSchemas({
  schemas: [
    ceSchema,
    eeSchema,
  ],
});

export const registerGroupDeletionCallbacks = () => {
  registerGroupDeletionCallback('jobs', phJob.destroyByGroup);
  registerGroupDeletionCallback('schedules', phSchedule.destroyByGroup);
  registerGroupDeletionCallback('deployments', phDeployment.destroyByGroup);
};
