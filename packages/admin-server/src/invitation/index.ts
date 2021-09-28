import { Config } from '../config';
import Koa from 'koa';
import { gql, GraphQLClient } from 'graphql-request';
import Router from 'koa-router';

interface InvitationProxyOptions {
  config: Config;
}

export class InvitationCtrl {
  private config: Config;
  private graphqlClient: GraphQLClient;

  public constructor(opts: InvitationProxyOptions) {
    const { config } = opts;
    this.config = config;
    this.graphqlClient = new GraphQLClient(config.graphqlSvcEndpoint, {
      headers: {
        authorization: `Bearer ${config.sharedGraphqlSecretKey}`,
      },
    });
  }

  private createUserFromInvitation = async (
    ctx: Koa.ParameterizedContext,
    next: any
  ) => {
    const { invitationToken, username } = ctx.request.body;

    if (!(invitationToken && username)) {
      ctx.body = {
        code: 'BAD_REQUEST',
        message: 'Invalid token or username.',
      };
    }

    // invalid token
    try {
      const result: { validation: boolean } = await this.validate(
        invitationToken
      );
      if (!result.validation) {
        ctx.body = {
          code: 'BAD_REQUEST',
          message: 'Invalid token.',
        };
      }
    } catch (error) {
      console.error(error);

      ctx.body = {
        code: 'BAD_REQUEST',
        message: 'Invalid token.',
      };
    }

    try {
      const createdUser = await this.createUserByToken(
        invitationToken,
        username
      );
      ctx.body = {
        code: 'SUCCESS',
        createdUser,
      };
    } catch (error) {
      if (error.response?.errors) {
        ctx.body = {
          code: 'BAD_REQUEST',
          message: error.response?.errors[0].message,
        };
      }

      ctx.body = {
        code: 'BAD_REQUEST',
        message: 'Invalid token or duplicated username.',
      };
    }
  }

  private createUserByToken = async (
    invitationToken: string,
    username: string
  ): Promise<any> => {
    const variables = {
      data: { invitationToken, username },
    };
    const query = gql`
      mutation CreateUserFromInvitation($data: InvitationApplyInput!) {
        createUserFromInvitation(data: $data) {
          username
          password
        }
      }
    `;
    const data = await this.graphqlClient.request(query, variables);
    return data.createUserFromInvitation;
  }

  private validate = async (invitationToken: string): Promise<any> => {
    const variables = {
      data: { invitationToken },
    };
    const query = gql`
      query queryInvitaion($data: InvitationQueryInput!) {
        invitation(data: $data) {
          validation
        }
      }
    `;
    const data = await this.graphqlClient.request(query, variables);
    return data.invitation;
  }

  public mount(staticPath: string, rootRouter: Router) {
    rootRouter.post(`/invite`, this.createUserFromInvitation);

    rootRouter.get(
      '/invite/*',
      async (ctx: Koa.ParameterizedContext, next: any) => {
        return next();
      },
      async ctx => {
        await ctx.render('anonymous', {
          title: 'PrimeHub',
          staticPath,
        });
      }
    );
  }
}
