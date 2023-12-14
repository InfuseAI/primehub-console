import path from 'path';
import * as system from './system';
import * as timezone from './timezone';
import * as user from './user';
import * as group from './group';
import { crd as instanceType} from './instanceType';
import { crd as dataset, regenerateUploadSecret} from './dataset';
import { crd as image} from './image';
import * as secret from './secret';
import * as store from './store';
import * as datasetV2 from './datasetV2';
import * as phApplication from './phApplication';
import * as phAppTemplate from './phAppTemplate';
import * as notebook from './notebook';
import * as invitation from './invitation';

import * as GraphQLJSON from 'graphql-type-json';
import { gql } from 'apollo-server';
import { importSchema } from 'graphql-import';
import { makeExecutableSchema } from 'graphql-tools';

// A map of functions which return data for the schema.
export const resolvers = {
  Query: {
    system: system.query,
    timezone: timezone.query,
    me: user.me,
    user: user.queryOne,
    users: user.query,
    usersConnection: user.connectionQuery,
    group: group.queryOne,
    groups: group.query,
    groupsConnection: group.connectionQuery,
    groupResourcesToBeDeleted: group.groupResourcesToBeDeleted,
    secret: secret.queryOne,
    secrets: secret.query,
    secretsConnection: secret.connectionQuery,
    files: store.query,
    sharedFile: store.querySharedFile,
    datasetV2: datasetV2.query,
    datasetV2Files: datasetV2.queryFile,
    datasetV2Connection: datasetV2.connectionQuery,
    phApplication: phApplication.queryOne,
    phApplications: phApplication.query,
    phApplicationsConnection: phApplication.connectionQuery,
    phAppTemplate: phAppTemplate.queryOne,
    phAppTemplates: phAppTemplate.query,
    invitation: invitation.queryInvitation,
    jobQueueStatus: store.jobQueueStatus,
    ...instanceType.resolvers(),
    ...dataset.resolvers(),
    ...image.resolvers(),
  },
  Mutation: {
    updateSystem: system.update,
    createUser: user.create,
    updateUser: user.update,
    deleteUser: user.destroy,
    revokeApiToken: user.revokeApiToken,
    sendEmail: user.sendEmail,
    sendMultiEmail: user.sendMultiEmail,
    resetPassword: user.resetPassword,
    createGroup: group.create,
    updateGroup: group.update,
    deleteGroup: group.destroy,
    createSecret: secret.create,
    updateSecret: secret.update,
    deleteSecret: secret.destroy,
    regenerateUploadServerSecret: regenerateUploadSecret,
    deleteFiles: store.destroy,
    shareFile: store.share,
    unshareFile: store.unshare,
    createDatasetV2: datasetV2.create,
    updateDatasetV2: datasetV2.update,
    deleteDatasetV2: datasetV2.destroy,
    copyFilesToDatasetV2: datasetV2.copyFiles,
    createPhApplication: phApplication.create,
    updatePhApplication: phApplication.update,
    deletePhApplication: phApplication.destroy,
    startPhApplication: phApplication.start,
    stopPhApplication: phApplication.stop,
    importPhAppTemplateFromURL: phAppTemplate.importFromURL,
    updatePhAppTemplateFromURL: phAppTemplate.updateFromURL,
    notifyNotebookEvent: notebook.notifyNotebookEvent,
    ...instanceType.resolveInMutation(),
    ...dataset.resolveInMutation(),
    ...image.resolveInMutation(),
    createInvitation: invitation.createInvitation,
    createUserFromInvitation: invitation.createUserFromInvitation,
    zipFiles: store.zipFiles,
  },
  System: {
    smtp: system.querySmtp,
  },
  User: user.typeResolvers,
  Group: group.typeResolvers,
  ...instanceType.typeResolver(),
  ...dataset.typeResolver(),
  ...image.typeResolver(),
  PhApplication: phApplication.typeResolvers,

  // scalars
  JSON: GraphQLJSON
};

export const schema: any = makeExecutableSchema({
  typeDefs: gql(importSchema(path.resolve(__dirname, '../graphql/index.graphql'))),
  resolvers,
});

export const registerGroupDeletionCallbacks = () => {
  group.registerGroupDeletionCallback('apps', phApplication.destroyByGroup);
  group.registerGroupDeletionCallback('datasets', datasetV2.destroyByGroup);
  group.registerGroupDeletionCallback('sharedFiles', store.destroyByGroup);
};
