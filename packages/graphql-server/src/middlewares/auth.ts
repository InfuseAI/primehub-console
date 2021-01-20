import { rule, shield, and, or, not } from 'graphql-shield';
import { isAdmin, isClient, isUser } from '../utils/roles';

export const permissions = shield({
  Query: {
    '*': isAdmin,
    'system': or(isAdmin, isClient),
    'me': or(isAdmin, isUser),
    'user': or(isAdmin, isClient),
    'group': or(isAdmin, isClient),
    'groups': or(isAdmin, isClient),
    'instanceType': or(isAdmin, isClient),
    'image': or(isAdmin, isUser, isClient),
    'images': or(isAdmin, isUser, isClient),
    'imagesConnection': or(isAdmin, isUser, isClient),
    'files': or(isAdmin, isUser),
  },
  Mutation: {
    '*': isAdmin,
    'revokeApiToken': or(isAdmin, isUser),
    'createImage': or(isAdmin, isUser),
    'updateImage': or(isAdmin, isUser),
    'deleteImage': or(isAdmin, isUser),
    'deleteFiles': or(isAdmin, isUser),
  },
}, {
  allowExternalErrors: true
});
