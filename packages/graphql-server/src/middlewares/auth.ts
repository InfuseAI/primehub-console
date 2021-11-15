import { rule, shield, and, or, not } from 'graphql-shield';
import { isAdmin, isClient, isUser, isGroupAdmin } from '../utils/roles';
export const ShieldQuery = {
  '*': isAdmin,
  'system': or(isAdmin, isClient),
  'me': or(isAdmin, isUser),
  'user': or(isAdmin, isClient),
  'group': or(isAdmin, isGroupAdmin, isClient),
  'groups': or(isAdmin, isClient),
  'datasets': or(isAdmin, isClient),
  'instanceType': or(isAdmin, isClient),
  'secret': or(isAdmin, isUser, isClient),
  'secrets': or(isAdmin, isUser, isClient),
  'image': or(isAdmin, isUser, isClient),
  'images': or(isAdmin, isUser, isClient),
  'imagesConnection': or(isAdmin, isUser, isClient),
  'phAppTemplates': or(isAdmin, isUser, isClient),
  'phApplication': or(isAdmin, isUser, isClient),
  'phApplications': or(isAdmin, isUser, isClient),
  'phApplicationsConnection': or(isAdmin, isUser, isClient),
  'groupImagesConnection': or(isAdmin, isUser, isClient),
  'files': or(isAdmin, isUser),
  'sharedFile': or(isAdmin, isUser),
  'datasetV2': or(isAdmin, isUser),
  'datasetV2Connection': or(isAdmin, isUser),
};

export const ShieldMutation = {
  '*': isAdmin,
  'revokeApiToken': or(isAdmin, isUser),
  'createImage': or(isAdmin, isUser),
  'updateImage': or(isAdmin, isUser),
  'rebuildImage': or(isAdmin, isUser),
  'cancelImageBuild': or(isAdmin, isUser),
  'deleteImage': or(isAdmin, isUser),
  'deleteFiles': or(isAdmin, isUser),
  'shareFile': or(isAdmin, isUser),
  'unshareFile': or(isAdmin, isUser),
  'createPhApplication': or(isAdmin, isUser),
  'updatePhApplication': or(isAdmin, isUser),
  'deletePhApplication': or(isAdmin, isUser),
  'startPhApplication': or(isAdmin, isUser),
  'stopPhApplication': or(isAdmin, isUser),
  'notifyNotebookEvent': or(isClient),
  'createUserFromInvitation': or(isClient, isAdmin),
};

export const permissions = shield({
  Query: ShieldQuery,
  Mutation: ShieldMutation,
}, {
  allowExternalErrors: true
});
