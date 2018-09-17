import { Context } from 'koa';
import Boom from 'boom';
import Router from 'koa-router';
import gravatar from 'gravatar';
import querystring from 'querystring';
import Token from './token';
import { URL } from 'url';
import { get } from 'lodash';
import { ErrorCodes } from '../errorCodes';
import { ApolloError } from 'apollo-server-koa';

const CALLBACK_PATH = '/oidc/callback';

const ERRORS = {
  FORCE_LOGIN: 'FORCE_LOGIN'
};

export class OidcCtrl {
  private secret: string;
  private clientId: string;
  private cmsHost: string;
  private realm: string;
  private keycloakBaseUrl: string;
  private oidcClient: any;
  private redirectUri: string;
  private adminRole: string;
  private grantType: string;

  constructor({
    secret,
    realm,
    clientId,
    cmsHost,
    keycloakBaseUrl,
    oidcClient,
    grantType
  }: {
    secret: string,
    clientId: string,
    realm: string,
    cmsHost: string,
    keycloakBaseUrl: string,
    oidcClient: any,
    grantType: string
  }) {
    this.secret = secret;
    this.clientId = clientId;
    this.cmsHost = cmsHost;
    this.realm = realm;
    this.grantType = grantType;
    this.keycloakBaseUrl = keycloakBaseUrl;
    this.oidcClient = oidcClient;
    this.redirectUri = `${this.cmsHost}${CALLBACK_PATH}`;
    this.adminRole = (this.realm === 'master') ? 'realm:admin' : 'realm-management:realm-admin';
  }

  public ensureAdmin = async (ctx: Context, next: any) => {
    if (this.grantType === 'password') {
      ctx.state.username = '';
      ctx.state.thumbnail = '';
      return next();
    }

    try {
      if (!ctx.cookies.get('accessToken') || !ctx.cookies.get('refreshToken')) {
        throw Boom.forbidden('require token', {code: ERRORS.FORCE_LOGIN});
      }
      // check the user is admin, otherwise throw forbidden
      const accessToken = new Token(ctx.cookies.get('accessToken', {signed: true}), this.clientId);
      const refreshToken = new Token(ctx.cookies.get('refreshToken', {signed: true}), this.clientId);
      if (!accessToken.hasRole(this.adminRole)) {
        throw Boom.forbidden('require admin user', {code: ERRORS.FORCE_LOGIN});
      }

      // if refresh token expired
      if (refreshToken.isExpired()) {
        throw Boom.forbidden('refresh token expired', {code: ERRORS.FORCE_LOGIN});
      }
      ctx.state.username = ctx.cookies.get('username');
      ctx.state.thumbnail = ctx.cookies.get('thumbnail');
      return next();
    } catch (err) {
      // redirect to keycloak
      if (err.data && err.data.code === ERRORS.FORCE_LOGIN) {
        // tslint:disable-next-line:no-console
        console.log(err);
        const backUrl = this.buildBackUrl(ctx.href);
        const loginUrl = this.getLoginUrl(backUrl);
        return ctx.redirect(loginUrl);
      }
      throw err;
    }
  }

  public getAccessToken = async (ctx: Context): Promise<string> => {
    const refreshToken = ctx.cookies.get('refreshToken', {signed: true});
    const refreshTokenInst = new Token(refreshToken, this.clientId);

    if (refreshTokenInst.isExpired()) {
      throw this.createExpiredError(ctx.header.referer);
    }

    // refresh to get token
    // catch invalid_grant error
    try {
      const tokenSet = await this.oidcClient.refresh(refreshToken);
      return tokenSet.access_token;
    } catch (err) {
      if (err.error === 'invalid_grant' &&
        get(err, 'error_description', '').indexOf('expired') >= 0) {
        throw this.createExpiredError(ctx.header.referer);
      }

      throw err;
    }
  }

  public getLoginUrl = (backUrl?: string) => {
    let redirectUri = this.redirectUri;
    if (backUrl) {
      redirectUri += `?backUrl=${backUrl}`;
    }
    const loginUrl = this.oidcClient.authorizationUrl({
      redirect_uri: redirectUri
    });
    return loginUrl;
  }

  public clientCredentialGrant = async () => {
    const tokenSet = await this.oidcClient.grant({
      grant_type: 'client_credentials'
    });
    return tokenSet.access_token;
  }

  public callback = async (ctx: Context) => {
    const query = ctx.query;
    const redirectUri = query.backUrl ?
      `${this.redirectUri}?backUrl=${encodeURIComponent(query.backUrl)}` : this.redirectUri;

    const tokenSet = await this.oidcClient.authorizationCallback(redirectUri, query);
    const accessToken = new Token(tokenSet.access_token, this.clientId);
    if (!accessToken.hasRole(this.adminRole)) {
      throw Boom.forbidden('only admin can access admin-ui');
    }

    // redirect to frontend
    ctx.cookies.set('accessToken', tokenSet.access_token, {signed: true});
    ctx.cookies.set('refreshToken', tokenSet.refresh_token, {signed: true});
    ctx.cookies.set('username', accessToken.getContent().preferred_username, {signed: true});
    ctx.cookies.set('thumbnail',
      accessToken.getContent().email ? gravatar.url(accessToken.getContent().email) : '', {signed: true});

    const backUrl = query.backUrl || '/cms';
    return ctx.redirect(backUrl);
  }

  public logout = async (ctx: Context) => {
    const qs = querystring.stringify({redirect_uri: `${this.cmsHost}/cms`});
    ctx.cookies.set('accessToken', null);
    ctx.cookies.set('refreshToken', null);
    ctx.cookies.set('username', null);
    ctx.cookies.set('thumbnail', null);
    return ctx.redirect(`${this.keycloakBaseUrl}/realms/${this.realm}/protocol/openid-connect/logout?${qs}`);
  }

  private buildBackUrl = (currentUrl?: string) => {
    if (!currentUrl) {
      return null;
    }
    const url = new URL(currentUrl);
    return encodeURIComponent(url.pathname + url.search);
  }

  private createExpiredError = (currentUrl?: string) => {
    const err = new ApolloError('expired', ErrorCodes.REFRESH_TOKEN_EXPIRED);
    const backUrl = this.buildBackUrl(currentUrl);
    const loginUrl = this.getLoginUrl(backUrl);
    err.extensions.loginUrl = loginUrl;
    return err;
  }
}

export const mount = (rootRouter: Router, oidcCtrl: OidcCtrl) => {
  rootRouter.get(CALLBACK_PATH, oidcCtrl.callback);
  rootRouter.get('/oidc/logout', oidcCtrl.logout);
};
