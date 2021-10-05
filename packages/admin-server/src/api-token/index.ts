import { Config } from '../config';
import Koa from 'koa';
import { gql, GraphQLClient } from 'graphql-request';
import Router from 'koa-router';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface ApiTokenOtpions {
  config: Config;
}

export class ApiTokenCtrl {
  private config: Config;
  private redirectUri: string;

  public constructor(opts: ApiTokenOtpions) {
    const { config } = opts;
    this.config = config;

    this.redirectUri = `${config.cmsHost}${
      config.appPrefix || ''
    }/api-token/callback`;
  }

  public mount(staticPath: string, rootRouter: Router) {

    // OIDC starting flow
    rootRouter.get(
      '/api-token/request',
      async (ctx: Koa.ParameterizedContext, next: any) => {
        return next();
      },
      async ctx => {
        // redirect to OIDC auth
        const config = this.config;

        const queryString = `response_type=code&scope=offline_access&client_id=${
          config.keycloakClientId
        }&redirect_uri=${this.redirectUri}&state=${uuidv4()}`;

        const authorizationCodeUrl = encodeURI(
          `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/auth?${queryString}`
        );

        console.log('redirect api-token request to oidc', authorizationCodeUrl);
        ctx.redirect(authorizationCodeUrl);
      }
    );

    // Callback for OIDC to show Authorization Code
    rootRouter.get(
      '/api-token/callback',
      async (ctx: Koa.ParameterizedContext, next: any) => {
        return next();
      },
      async ctx => {
        const querystring = encode(ctx.request.querystring);
        ctx.state.apiTokenExhangeCode = querystring;
        await ctx.render('anonymous', {
          title: 'PrimeHub',
          staticPath,
        });
      }
    );

    // Fetch token by server to server call
    rootRouter.post(
      '/api-token/exchange',
      async (ctx: Koa.ParameterizedContext, next: any) => {
        return next();
      },
      async ctx => {
        const config = this.config;
        const { code } = ctx.request.body;
        const oidcParams = decode(code);
        const params = `grant_type=authorization_code&client_id=${config.keycloakClientId}&client_secret=${config.keycloakClientSecret}&redirect_uri=${this.redirectUri}&${oidcParams}`;
        const tokenUrl = `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/protocol/openid-connect/token`;

        try {
          const response = await axios.post(tokenUrl, params);

          ctx.body = response.data.refresh_token;
          const user_data = decode(response.data.access_token.split('.')[1]);

          const data = {
            'api-token': response.data.refresh_token,
            endpoint: config.graphqlEndpoint,
          };

          ctx.body = JSON.stringify(data);
        } catch (error) {
          console.error(error);
          ctx.body = error.response.data;
        }
      }
    );

    const decode = (str: string): string =>
      Buffer.from(str, 'base64').toString('binary');

    const encode = (str: string): string =>
      Buffer.from(str, 'binary').toString('base64');
  }
}