import { Context } from 'koa';
import Boom from 'boom';
import Router from 'koa-router';
import gravatar from 'gravatar';
import querystring from 'querystring';
import Token from './token';
import { URL } from 'url';
import { ErrorCodes } from '../errorCodes';
import * as logger from '../logger';
import { get } from 'lodash';
import { createHash } from 'crypto';
import UUID from 'uuid';

const CALLBACK_PATH = '/oidc/callback';
const NONCE_COOKIE = 'oidc.nonce';

const ERRORS = {
  FORCE_LOGIN: 'FORCE_LOGIN'
};

export class OidcCtrl {
  private clientId: string;
  private cmsHost: string;
  private realm: string;
  private keycloakBaseUrl: string;
  private oidcClient: any;
  private redirectUri: string;
  private adminRole: string;
  private appPrefix?: string;
  private defaultReturnPath: string;
  private enableUserPortal: boolean;

  constructor({
    realm,
    clientId,
    cmsHost,
    keycloakBaseUrl,
    oidcClient,
    appPrefix,
    enableUserPortal
  }: {
    realm: string,
    clientId: string,
    cmsHost: string,
    keycloakBaseUrl: string,
    oidcClient: any,
    appPrefix?: string,
    enableUserPortal: boolean,
  }) {
    this.clientId = clientId;
    this.cmsHost = cmsHost;
    this.realm = realm;
    this.keycloakBaseUrl = keycloakBaseUrl;
    this.oidcClient = oidcClient;
    this.redirectUri = `${this.cmsHost}${appPrefix || ''}${CALLBACK_PATH}`;
    this.adminRole = (this.realm === 'master') ? 'realm:admin' : 'realm-management:realm-admin';
    this.appPrefix = appPrefix;
    this.enableUserPortal = enableUserPortal;

    // build default return path
    const returnPath = enableUserPortal ? '/landing' : '/cms';
    this.defaultReturnPath = appPrefix ?
      `${appPrefix}${returnPath}` :
      returnPath;
  }

  public ensureAdmin = async (ctx: Context, next: any) => {
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

      let accessTokenExp = parseInt(accessToken.getContent().exp, 10);
      let refreshTokenExp = parseInt(refreshToken.getContent().exp, 10);

      // get new access token if it's going to expire in 5 sec, or already expired
      if (accessToken.isExpiredIn(5000)) {
        const tokenSet = await this.oidcClient.refresh(refreshToken);
        ctx.cookies.set('accessToken', tokenSet.access_token, {signed: true});
        ctx.cookies.set('refreshToken', tokenSet.refresh_token, {signed: true});
        accessTokenExp = parseInt(new Token(tokenSet.access_token, this.clientId).getContent().exp, 10);
        refreshTokenExp = parseInt(new Token(tokenSet.refresh_token, this.clientId).getContent().exp, 10);

        // notify frontend to change token in localstorage
        ctx.state.newAccessToken = tokenSet.access_token;
      }

      ctx.state.accessTokenExp = accessTokenExp;
      ctx.state.refreshTokenExp = refreshTokenExp;
      ctx.state.username = ctx.cookies.get('username');
      ctx.state.thumbnail = ctx.cookies.get('thumbnail');
      return next();
    } catch (err) {
      // redirect to keycloak
      if (err.data && err.data.code === ERRORS.FORCE_LOGIN) {
        logger.warn({
          component: logger.components.authentication,
          type: 'FORCE_LOGIN',
          url: ctx.url
        });

        // require to login
        const nonce = this.saveNonceSecret(ctx);
        const backUrl = this.buildBackUrl(ctx.href);
        const loginUrl = this.getLoginUrl(nonce, backUrl);
        return ctx.redirect(loginUrl);
      }
      throw err;
    }
  }

  public loggedIn = async (ctx: Context, next: any) => {
    try {
      if (!ctx.cookies.get('accessToken') || !ctx.cookies.get('refreshToken')) {
        throw Boom.forbidden('require token', {code: ERRORS.FORCE_LOGIN});
      }
      const accessToken = new Token(ctx.cookies.get('accessToken', {signed: true}), this.clientId);
      const refreshToken = new Token(ctx.cookies.get('refreshToken', {signed: true}), this.clientId);

      // if refresh token expired
      if (refreshToken.isExpired()) {
        throw Boom.forbidden('refresh token expired', {code: ERRORS.FORCE_LOGIN});
      }

      let accessTokenExp = parseInt(accessToken.getContent().exp, 10);
      let refreshTokenExp = parseInt(refreshToken.getContent().exp, 10);

      // get new access token if it's going to expire in 5 sec, or already expired
      if (accessToken.isExpiredIn(5000)) {
        const tokenSet = await this.oidcClient.refresh(refreshToken);
        ctx.cookies.set('accessToken', tokenSet.access_token, {signed: true});
        ctx.cookies.set('refreshToken', tokenSet.refresh_token, {signed: true});
        accessTokenExp = parseInt(new Token(tokenSet.access_token, this.clientId).getContent().exp, 10);
        refreshTokenExp = parseInt(new Token(tokenSet.refresh_token, this.clientId).getContent().exp, 10);

        // notify frontend to change token in localstorage
        ctx.state.newAccessToken = tokenSet.access_token;
      }

      ctx.state.accessTokenExp = accessTokenExp;
      ctx.state.refreshTokenExp = refreshTokenExp;
      ctx.state.username = ctx.cookies.get('username');
      ctx.state.thumbnail = ctx.cookies.get('thumbnail');
      ctx.state.isUserAdmin = accessToken.hasRole(this.adminRole);
      return next();
    } catch (err) {
      // redirect to keycloak
      if (err.data && err.data.code === ERRORS.FORCE_LOGIN) {
        logger.warn({
          component: logger.components.authentication,
          type: 'FORCE_LOGIN',
          url: ctx.url
        });

        // require to login
        const nonce = this.saveNonceSecret(ctx);
        const backUrl = this.buildBackUrl(ctx.href);
        const loginUrl = this.getLoginUrl(nonce, backUrl);
        return ctx.redirect(loginUrl);
      }
      throw err;
    }
  }

  public refreshTokenSet = async (ctx: any) => {
    const refreshToken = ctx.cookies.get('refreshToken', {signed: true});
    if (!refreshToken) {
      throw Boom.forbidden('require token');
    }
    const refreshTokenInst = new Token(refreshToken, this.clientId);
    const backUrl = this.buildBackUrl(ctx.header.referer);
    const nonce = this.createNonceFromSecret(ctx);
    const redirectUrl = this.getLoginUrl(nonce, backUrl);

    if (refreshTokenInst.isExpired()) {
      logger.info({
        component: logger.components.user,
        type: 'AUTH',
        message: 'refresh token is expired. Redirecting user to login page'
      });
      return ctx.body = {redirectUrl};
    }

    // get refresh token
    try {
      const tokenSet = await this.oidcClient.refresh(refreshToken);
      // set refreshToken, accessToken on cookie
      ctx.cookies.set('accessToken', tokenSet.access_token, {signed: true});
      ctx.cookies.set('refreshToken', tokenSet.refresh_token, {signed: true});
      const newAccessToken = new Token(tokenSet.access_token, this.clientId);
      const newRefreshToken = new Token(tokenSet.refresh_token, this.clientId);

      logger.info({
        component: logger.components.user,
        type: 'AUTH',
        message: 'get new token set from keycloak',
        oldRefreshTokenExp: refreshTokenInst.getContent().exp,
        newRefreshTokenExp: newRefreshToken.getContent().exp,
        newAccessTokenExp: newAccessToken.getContent().exp
      });

      return ctx.body = {
        redirectUrl,
        accessTokenExp: parseInt(newAccessToken.getContent().exp, 10),
        refreshTokenExp: parseInt(newRefreshToken.getContent().exp, 10),
        accessToken: tokenSet.access_token
      };
    } catch (err) {
      /**
       * Possible errors
       * invalid_grant for expiration
       * invalid_grant (Session not active) => for user deleted
       * invalid_scope (User or client no longer has role permissions for client key: realm-management)
       *  => for remove user from admin
       */
      if (err.error === 'invalid_grant' || err.error === 'invalid_scope') {
        logger.warn({
          component: logger.components.user,
          type: 'AUTH',
          message: 'invalid_grant or invalid_scope error',
        });

        return ctx.body = {redirectUrl};
      }

      throw err;
    }
  }

  public getLoginUrl = (nonce: string, backUrl?: string) => {
    let redirectUri = this.redirectUri;
    if (backUrl) {
      redirectUri += `?backUrl=${backUrl}`;
    }
    const loginUrl = this.oidcClient.authorizationUrl({
      redirect_uri: redirectUri,
      nonce
    });
    return loginUrl;
  }

  public clientCredentialGrant = async () => {
    const tokenSet = await this.oidcClient.grant({
      grant_type: 'client_credentials'
    });
    return tokenSet.access_token;
  }

  public callback = async (ctx: any) => {
    const query = ctx.query;
    const redirectUri = query.backUrl ?
      `${this.redirectUri}?backUrl=${encodeURIComponent(query.backUrl)}` : this.redirectUri;

    const nonce = this.createNonceFromSecret(ctx);
    const tokenSet = await this.oidcClient.authorizationCallback(redirectUri, query, {nonce});
    const accessToken = new Token(tokenSet.access_token, this.clientId);

    // redirect to frontend
    ctx.cookies.set('accessToken', tokenSet.access_token, {signed: true});
    ctx.cookies.set('refreshToken', tokenSet.refresh_token, {signed: true});
    ctx.cookies.set('username', accessToken.getContent().preferred_username, {signed: true});
    ctx.cookies.set('thumbnail',
      accessToken.getContent().email ? gravatar.url(accessToken.getContent().email) : '', {signed: true});

    const backUrl = query.backUrl || this.defaultReturnPath;

    logger.info({
      component: logger.components.user,
      type: 'LOGIN',
      userId: accessToken.getContent().sub,
      username: accessToken.getContent().preferred_username,
      email: accessToken.getContent().email
    });
    return ctx.render('login', {accessToken: tokenSet.access_token, redirectUrl: backUrl});
  }

  public logout = async (ctx: any) => {
    const qs = querystring.stringify({redirect_uri: `${this.cmsHost}${this.defaultReturnPath}`});
    const accessToken = new Token(ctx.cookies.get('accessToken', {signed: true}), this.clientId);
    ctx.cookies.set('accessToken', null);
    ctx.cookies.set('refreshToken', null);
    ctx.cookies.set('username', null);
    ctx.cookies.set('thumbnail', null);
    ctx.cookies.set(NONCE_COOKIE, null);

    logger.info({
      component: logger.components.user,
      type: 'LOGOUT',
      userId: get(accessToken.getContent(), 'sub'),
      username: get(accessToken.getContent(), 'preferred_username')
    });
    return ctx.redirect(`${this.keycloakBaseUrl}/realms/${this.realm}/protocol/openid-connect/logout?${qs}`);
  }

  public getUserFromContext = (ctx: any) => {
    const accessToken = new Token(ctx.cookies.get('accessToken', {signed: true}), this.clientId);
    return {
      userId: accessToken.getContent().sub,
      username: accessToken.getContent().preferred_username
    };
  }

  private buildBackUrl = (currentUrl?: string) => {
    if (!currentUrl) {
      return null;
    }
    const url = new URL(currentUrl);
    return encodeURIComponent(url.pathname + url.search);
  }

  private createNonceFromSecret = (ctx: Context) => {
    const secret = ctx.cookies.get(NONCE_COOKIE, {signed: true});
    const hash = createHash('sha256').update(secret).digest('hex');
    return hash;
  }

  private saveNonceSecret = (ctx: Context) => {
    const secret = UUID.v1();
    ctx.cookies.set(NONCE_COOKIE, secret, {signed: true});
    return createHash('sha256').update(secret).digest('hex');
  }
}

export const mount = (rootRouter: Router, oidcCtrl: OidcCtrl) => {
  rootRouter.get(CALLBACK_PATH, oidcCtrl.callback);
  rootRouter.post('/oidc/refresh-token-set', oidcCtrl.refreshTokenSet);
  rootRouter.get('/oidc/logout', oidcCtrl.logout);
};
