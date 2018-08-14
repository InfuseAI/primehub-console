import { Context } from 'koa';
import jwt from 'jsonwebtoken';
import Boom from 'boom';
import Router from 'koa-router';
import querystring from 'querystring';
import Token from './token';

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
    this.redirectUri = `${this.cmsHost}/${CALLBACK_PATH}`;
    this.adminRole = (this.realm === 'master') ? 'realm:admin' : 'realm-management:realm-admin';
  }

  public ensureAdmin = async (ctx: Context, next: any) => {
    if (this.grantType === 'password') {
      return next();
    }

    try {
      const tokens = this.deserializeToken(ctx.header.Authorization);
      // check the user is admin, otherwise throw forbidden
      const accessToken = new Token(tokens.accessToken, this.clientId);
      const refreshToken = new Token(tokens.refreshToken, this.clientId);
      if (!accessToken.hasRole(this.adminRole)) {
        throw Boom.forbidden('require admin user', {code: ERRORS.FORCE_LOGIN});
      }

      // if refresh token expired
      if (refreshToken.isExpired()) {
        throw Boom.forbidden('refresh token expired', {code: ERRORS.FORCE_LOGIN});
      }

      return next();
    } catch (err) {
      // redirect to keycloak
      if (err.code === ERRORS.FORCE_LOGIN) {
        const loginUrl = this.oidcClient.authorizationUrl({
          redirect_uri: this.redirectUri
        });
        return ctx.redirect(loginUrl);
      }
      throw err;
    }
  }

  public getAccessToken = async (authorization: string): Promise<string> => {
    const tokens = this.deserializeToken(authorization);
    // refresh to get token
    const tokenSet = await this.oidcClient.refresh(tokens.accessToken);
    return tokenSet.access_token;
  }

  public callback = async (ctx: Context) => {
    const query = ctx.query;
    const tokenSet = await this.oidcClient.authorizationCallback(this.redirectUri, query);
    const accessToken = new Token(tokenSet.access_token, this.clientId);
    if (!accessToken.hasRole(this.adminRole)) {
      throw Boom.forbidden('only admin can access admin-ui');
    }

    // redirect to frontend
    const token = this.serializeToken(tokenSet);
    const tokenQuery = querystring.stringify({token});
    ctx.redirect(`${this.cmsHost}/cms?${tokenQuery}`);
  }

  private serializeToken(tokenSet: any) {
    return jwt.sign({
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token
    }, this.secret);
  }

  private deserializeToken(token: string): {refreshToken: string, accessToken: string} {
    if (!token) {
      throw Boom.forbidden('no auth header', {code: ERRORS.FORCE_LOGIN});
    }

    // get token from header
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded as any;
    } catch (e) {
      throw Boom.forbidden('cannot verify token', {code: ERRORS.FORCE_LOGIN});
    }
  }
}

export const mount = (rootRouter: Router, oidcCtrl: OidcCtrl) => {
  rootRouter.get(CALLBACK_PATH, oidcCtrl.callback);
};
