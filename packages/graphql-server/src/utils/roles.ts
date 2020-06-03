import { rule } from 'graphql-shield'
import { Context, Role } from '../resolvers/interface';

export const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    return ctx.role === Role.ADMIN;
  },
);

export const isUser = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.USER;
  },
);

// from phJob or jupyter client that use secret token
export const isClient = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.role === Role.CLIENT;
  },
);
