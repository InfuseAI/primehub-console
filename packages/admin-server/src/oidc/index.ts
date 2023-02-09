import Koa from 'koa';
import Boom from 'boom';
import Router from 'koa-router';
import gravatar from 'gravatar';
import querystring from 'querystring';
import Token from './token';
import { URL } from 'url';
import * as logger from '../logger';
import { get } from 'lodash';
import { Config } from '../config';
import { Client, generators } from 'openid-client';

const CALLBACK_PATH = '/oidc/callback';
const REQUEST_API_TOKEN_PATH = '/oidc/request-api-token';
const REQUEST_API_TOKEN_CALLBACK_PATH = '/oidc/request-api-token-callback';
const NONCE_COOKIE = 'oidc.nonce';

const ERRORS = {
  FORCE_LOGIN: 'FORCE_LOGIN'
};

interface OidcCtrlOptions {
  oidcClient: Client;
  config: Config;
}

export class OidcCtrl {
  private clientId: string;
  private cmsHost: string;
  private realm: string;
  private keycloakBaseUrl: string;
  private oidcClient: Client;
  private redirectUri: string;
  private adminRole: string;
  private appPrefix?: string;
  private cookiePath: string;
  private defaultReturnPath: string;

  constructor({
    oidcClient,
    config,
  }: OidcCtrlOptions) {
    this.clientId = config.keycloakClientId;
    this.cmsHost = config.cmsHost;
    this.realm = config.keycloakRealmName;
    this.keycloakBaseUrl = config.keycloakOidcBaseUrl;
    this.oidcClient = oidcClient;
    this.redirectUri = `${this.cmsHost}${config.appPrefix || ''}${CALLBACK_PATH}`;
    this.adminRole = (this.realm === 'master') ? 'realm:admin' : 'realm-management:realm-admin';
    this.appPrefix = config.appPrefix;
    this.cookiePath = config.appPrefix ? `${config.appPrefix}/` : '/';

    // build default return path
    const returnPath = '/g';
    this.defaultReturnPath = config.appPrefix ?
      `${config.appPrefix}${returnPath}` :
      returnPath;
  }

  public ensureAdmin = async (ctx: Koa.ParameterizedContext, next: any) => {
    try {
      if (!ctx.cookies.get('accessToken') || !ctx.cookies.get('refreshToken')) {
        throw Boom.forbidden('require token', {code: ERRORS.FORCE_LOGIN});
      }
      // check the user is admin, otherwise throw forbidden
      const accessToken = new Token(ctx.cookies.get('accessToken', {signed: true}), this.clientId);
      const refreshToken = new Token(ctx.cookies.get('refreshToken', {signed: true}), this.clientId);
      if (!accessToken.hasRole(this.adminRole)) {
        throw Boom.forbidden('require admin user', {message: 'You have to be admin to view this page'});
      }

      // if refresh token expired
      if (refreshToken.isExpired()) {
        throw Boom.forbidden('refresh token expired', {code: ERRORS.FORCE_LOGIN});
      }

      let accessTokenExp = parseInt(accessToken.getContent().exp, 10);
      let refreshTokenExp = parseInt(refreshToken.getContent().exp, 10);

      // get new access token if it's going to expire in 5 sec, or already expired
      if (accessToken.isExpiredIn(5000)) {
        const tokenSet = await this.oidcClient.refresh(refreshToken.toString());
        const opts = {
          signed: true,
          secure: ctx.request.secure,
          path: this.cookiePath,
        };
        ctx.cookies.set('accessToken', tokenSet.access_token, opts);
        ctx.cookies.set('refreshToken', tokenSet.refresh_token, opts);
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
      if (this.isForceLoginError(err) || this.isInvalidRefreshTokenError(err)) {
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

  public loggedIn = async (ctx: Koa.ParameterizedContext, next: any) => {
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
        const tokenSet = await this.oidcClient.refresh(refreshToken.toString());
        const opts = {
          signed: true,
          secure: ctx.request.secure,
          path: this.cookiePath,
        };
        ctx.cookies.set('accessToken', tokenSet.access_token, opts);
        ctx.cookies.set('refreshToken', tokenSet.refresh_token, opts);
        accessTokenExp = parseInt(new Token(tokenSet.access_token, this.clientId).getContent().exp, 10);
        refreshTokenExp = parseInt(new Token(tokenSet.refresh_token, this.clientId).getContent().exp, 10);

        // notify frontend to change token in localstorage
        ctx.state.newAccessToken = tokenSet.access_token;
      }

      ctx.state.accessTokenExp = accessTokenExp;
      ctx.state.refreshTokenExp = refreshTokenExp;
      ctx.state.userId = accessToken.getContent().sub;
      ctx.state.username = ctx.cookies.get('username');
      ctx.state.thumbnail = ctx.cookies.get('thumbnail');
      ctx.state.isUserAdmin = accessToken.hasRole(this.adminRole);
      return next();
    } catch (err) {
      // redirect to keycloak
      if (this.isForceLoginError(err) || this.isInvalidRefreshTokenError(err)) {
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
    const backUrl = this.buildBackUrl(ctx.header.referer);
    const nonce = this.createNonceFromSecret(ctx);
    const redirectUrl = this.getLoginUrl(nonce, backUrl);

    // get refresh token
    try {
      const refreshToken = ctx.cookies.get('refreshToken', {signed: true});
      if (!refreshToken) {
        throw Boom.forbidden('require token', {code: ERRORS.FORCE_LOGIN});
      }
      const refreshTokenInst = new Token(refreshToken, this.clientId);

      if (refreshTokenInst.isExpired()) {
        logger.info({
          component: logger.components.user,
          type: 'AUTH',
          message: 'refresh token is expired. Redirecting user to login page'
        });
        return ctx.body = {redirectUrl};
      }

      const tokenSet = await this.oidcClient.refresh(refreshToken);
      // set refreshToken, accessToken on cookie
      const opts = {
        signed: true,
        secure: ctx.request.secure,
        path: this.cookiePath,
      };
      ctx.cookies.set('accessToken', tokenSet.access_token, opts);
      ctx.cookies.set('refreshToken', tokenSet.refresh_token, opts);
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
      if (this.isForceLoginError(err) || this.isInvalidRefreshTokenError(err)) {
        logger.warn({
          component: logger.components.user,
          type: 'AUTH',
          message: 'force to re-login, or invalid_grant or invalid_scope error',
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
    try {
      const query = ctx.query;
      const redirectUri = query.backUrl ?
        `${this.redirectUri}?backUrl=${encodeURIComponent(query.backUrl)}` : this.redirectUri;

      const nonce = this.createNonceFromSecret(ctx);
      const tokenSet = await this.oidcClient.callback(redirectUri, query, {nonce});
      const accessToken = new Token(tokenSet.access_token, this.clientId);

      // redirect to frontend
      const opts = {
        signed: true,
        secure: ctx.request.secure,
        path: this.cookiePath,
      };
      ctx.cookies.set('accessToken', tokenSet.access_token, opts);
      ctx.cookies.set('refreshToken', tokenSet.refresh_token, opts);
      ctx.cookies.set('username', accessToken.getContent().preferred_username, opts);
      ctx.cookies.set('thumbnail',
        accessToken.getContent().email ?
        gravatar.url(accessToken.getContent().email)
        : '', opts);

      const backUrl = query.backUrl || this.defaultReturnPath;

      logger.info({
        component: logger.components.user,
        type: 'LOGIN',
        userId: accessToken.getContent().sub,
        username: accessToken.getContent().preferred_username,
        email: accessToken.getContent().email
      });
      return ctx.render('login', {accessToken: tokenSet.access_token, redirectUrl: backUrl});
    } catch (err) {
      logger.error({
        component: logger.components.user,
        type: 'CALLBACK',
        message: err.message,
      });
      return this.logout(ctx);
    }
  }

  public logout = async (ctx: any) => {
    const qs = querystring.stringify({redirect_uri: `${this.cmsHost}${this.defaultReturnPath}`});
    const accessToken = new Token(ctx.cookies.get('accessToken', {signed: true}), this.clientId);
    const opts = {
      path: this.cookiePath,
    };
    ctx.cookies.set('accessToken', null, opts);
    ctx.cookies.set('refreshToken', null, opts);
    ctx.cookies.set('username', null, opts);
    ctx.cookies.set('thumbnail', null, opts);
    ctx.cookies.set(NONCE_COOKIE, null, opts);

    logger.info({
      component: logger.components.user,
      type: 'LOGOUT',
      userId: get(accessToken.getContent(), 'sub'),
      username: get(accessToken.getContent(), 'preferred_username')
    });
    return ctx.redirect(`${this.keycloakBaseUrl}/realms/${this.realm}/protocol/openid-connect/logout?${qs}`);
  }

  public requestApiToken = async (ctx: any) => {
    const nonce = this.saveNonceSecret(ctx);
    const prefix = this.appPrefix ? this.appPrefix : '';
    const query = ctx.query;
    let redirectUri = `${this.cmsHost}${prefix}${REQUEST_API_TOKEN_CALLBACK_PATH}`;
    if (query.backUrl) {
      redirectUri = `${redirectUri}?backUrl=${encodeURIComponent(query.backUrl)}`;
    }

    const apiTokenUrl = this.oidcClient.authorizationUrl({
      redirect_uri: redirectUri,
      scope: 'openid offline_access',
      nonce
    });
    return ctx.redirect(apiTokenUrl);
  }

  public requestApiTokenCallback = async (ctx: any) => {
    const nonce = this.createNonceFromSecret(ctx);
    const prefix = this.appPrefix ? this.appPrefix : '';
    const query = ctx.query;
    let redirectUri = `${this.cmsHost}${prefix}${REQUEST_API_TOKEN_CALLBACK_PATH}`;
    if (query.backUrl) {
      redirectUri = `${redirectUri}?backUrl=${encodeURIComponent(query.backUrl)}`;
    }
    const tokenSet = await this.oidcClient.callback(redirectUri, query, {nonce});

    // redirect to frontend
    const secureRequest = ctx.request.secure;
    const opts = {
      expires: new Date(Date.now() + 60000),
      signed: true,
      secure: secureRequest,
      path: this.cookiePath,
    };
    ctx.cookies.set('apiToken', tokenSet.refresh_token, opts);

    const backUrl = query.backUrl || `${this.cmsHost}${this.appPrefix}/api-token`;

    logger.info({
      component: logger.components.user,
      type: 'REQUEST_API_TOKEN'
    });

    return ctx.redirect(backUrl);
  }

  private buildBackUrl = (currentUrl?: string) => {
    if (!currentUrl) {
      return null;
    }
    const url = new URL(currentUrl);
    return encodeURIComponent(url.pathname + url.search);
  }

  private createNonceFromSecret = (ctx: Koa.ParameterizedContext) => {
    const nonce = ctx.cookies.get(NONCE_COOKIE, {signed: true});
    return nonce;
  }

  private saveNonceSecret = (ctx: Koa.ParameterizedContext) => {
    const nonce = generators.nonce();
    const secureRequest = ctx.request.secure;
    ctx.cookies.set(NONCE_COOKIE, nonce, {signed: true, secure: secureRequest, path: this.cookiePath});
    return nonce;
  }

  private isForceLoginError = (err: any) => {
    return err && err.data && err.data.code === ERRORS.FORCE_LOGIN;
  }

  private isInvalidRefreshTokenError = (err: any) => {
    /**
     * Possible errors
     * invalid_grant for expiration
     * invalid_grant (Session not active) => for user deleted
     * invalid_scope (User or client no longer has role permissions for client key: realm-management)
     *  => for remove user from admin
     */
    return err && (err.error === 'invalid_grant' || err.error === 'invalid_scope');
  }
}

export const mount = (rootRouter: Router, oidcCtrl: OidcCtrl) => {
  rootRouter.get(CALLBACK_PATH, oidcCtrl.callback);
  rootRouter.post('/oidc/refresh-token-set', oidcCtrl.refreshTokenSet);
  rootRouter.get('/oidc/logout', oidcCtrl.logout);
  rootRouter.get(REQUEST_API_TOKEN_PATH, oidcCtrl.requestApiToken);
  rootRouter.get(REQUEST_API_TOKEN_CALLBACK_PATH, oidcCtrl.requestApiTokenCallback);
};
