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
  },
  Mutation: {
    '*': isAdmin,
    'revokeApiToken': or(isAdmin, isUser),
  },
}, {
  allowExternalErrors: true
});
