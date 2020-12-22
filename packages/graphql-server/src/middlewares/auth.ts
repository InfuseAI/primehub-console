import { rule, shield, and, or, not } from 'graphql-shield';
import { isAdmin, isClient, isUser, isGroupAdmin } from '../utils/roles';

export const permissions = shield({
  Query: {
    '*': or(isGroupAdmin, isAdmin),
    'system': or(isAdmin, isClient),
    'me': or(isAdmin, isUser),
    'user': or(isAdmin, isClient),
    'group': or(isAdmin, isClient),
    'groups': or(isAdmin, isClient),
    'instanceType': or(isAdmin, isClient),
  },
  Mutation: {
    '*': isAdmin,
    'revokeApiToken': or(isAdmin, isUser),
  },
}, {
  allowExternalErrors: true
});
