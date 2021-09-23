import NodeCache from 'node-cache';
import { Config } from '../config';
import { OidcCtrl } from '../oidc';
import cookie from 'cookie';
import Koa from 'koa';
import { v4 as uuidv4 } from 'uuid';
import { gql, GraphQLClient } from 'graphql-request';
import Boom from 'boom';
import HttpProxy from 'http-proxy';
import pathMatch from 'path-match';
import * as logger from '../logger';

const sessionTokenCacheExpireTime = 3600;
const phApplicationCacheExpireTime = 60;
const route = pathMatch({
  sensitive: false,
  strict: false,
  end: false
});

interface ProxyCtrlOptions {
  config: Config;
  oidcCtrl: OidcCtrl;
}

interface AppData {
  appID: string;
  group: string;
  scope: string;
  target: string;
  rewrite?: boolean;
}

export class ProxyCtrl {
  private oidcCtrl: OidcCtrl;
  private config: Config;
  private proxy;
  private sessionTokenCacheStore: NodeCache;
  private phApplicationCacheStore: NodeCache;
  private graphqlClient: GraphQLClient;
  private apiPrefix: string;
  private apiTarget: string;

  public constructor(opts: ProxyCtrlOptions) {
    const {config, oidcCtrl} = opts;

    this.config = config;
    this.oidcCtrl = oidcCtrl;

    this.sessionTokenCacheStore = new NodeCache({stdTTL: sessionTokenCacheExpireTime});
    this.phApplicationCacheStore = new NodeCache({stdTTL: phApplicationCacheExpireTime});

    this.graphqlClient = new GraphQLClient(config.graphqlSvcEndpoint, {
      headers: {
        authorization: `Bearer ${config.sharedGraphqlSecretKey}`,
      }
    });

    const graphqlUrl = new URL(this.config.graphqlSvcEndpoint);
    this.apiPrefix = graphqlUrl.pathname.replace('/graphql', '');
    this.apiTarget = `${graphqlUrl.protocol}//${graphqlUrl.host}`;

    this.proxy = HttpProxy.createProxyServer({ws: true});
    this.proxy.on('proxyReq', this.createProxyReqHandler());
  }

  private createProxyReqHandler = () => {
    const match = route(`${this.apiPrefix}/files/(.*)`);

    // node-http-proxy: proxyReq event handler. Here we proxy the file download to graphql
    //
    // Ref:
    //   https://github.com/http-party/node-http-proxy#listening-for-proxy-events
    return async (proxyReq, req, res, options) => {
      const params = match(req.url);
      if (!params) {
        return;
      }

      const cookies = cookie.parse(req.headers.cookie || {});
      const accessToken = cookies.accessToken || '';
      proxyReq.setHeader('Authorization', `Bearer ${accessToken}`);
    };
  }

  private async proxyWeb(ctx, opts) {
    return new Promise((resolve, reject) => {
      const oldPath = ctx.req.url;
      const {urlRewrite} = opts;

      if (typeof urlRewrite === 'function') {
        ctx.req.url = urlRewrite(ctx.req.url);
      }

      logger.debug({
        component: logger.components.proxy,
        type: 'PROXY_WEB',
        method: ctx.req.method,
        from: oldPath,
        to: new URL(ctx.req.url, opts.target),
      });

      // used to tell the logger don't print accesslog for proxy traffic
      ctx.req.isProxy = true;

      ctx.res.on('close', () => {
        const message = `Http response closed while proxying ${oldPath}`;
        logger.error({
          component: logger.components.proxy,
          type: 'PROXY_WEB',
          message: ''
        });
        reject(new Error(message));
      });

      ctx.res.on('finish', () => {
        resolve(undefined);
      });

      this.proxy.web(ctx.req, ctx.res, opts, e => {
        const msg = `Proxying error: ${e.code}`;
        logger.error({
          component: logger.components.proxy,
          type: 'PROXY_WEB',
          message: msg,
        });

        const status = {
          ECONNREFUSED: 503,
          ETIMEOUT: 504
        }[e.code];
        ctx.status = status || 500;
        resolve(undefined);
      });
    });
  }

  private createSessionToken(ctx: Koa.ParameterizedContext) {
    const appID = ctx.params.appID;
    // Generate session token
    const sessionToken = uuidv4();
    const cookiePath = this.config.appPrefix ?
      `${this.config.appPrefix}/apps/${appID}/` :
      `/apps/${appID}/`;
    const opts = {
      signed: true,
      secure: ctx.request.secure,
      path: cookiePath,
    };
    ctx.cookies.set('phapplication-session-id', sessionToken, opts);
    this.sessionTokenCacheStore.set(sessionToken, true, sessionTokenCacheExpireTime);

    return true;
  }

  private updateSessionTTL = (ctx: Koa.ParameterizedContext) => {
    const sessionToken = ctx.cookies.get('phapplication-session-id', {signed: true});
    this.sessionTokenCacheStore.ttl(sessionToken, sessionTokenCacheExpireTime);
  }

  private isMemberOfGroup = async (userId: string, group: string): Promise<boolean> => {
    const variables = {
      id: userId,
    };
    const query = gql`
    query ($id: ID!) {
      user(where: {id: $id}) {
        id
        username
        groups {name}
      }
    }
    `;
    const data = await this.graphqlClient.request(query, variables);

    for (const g of data.user.groups) {
      if (g.name === group) {
        return true;
      }
    }
    return false;
  }

  private queryAppData = async (appID: string): Promise<AppData> => {
    const variables = {
      id: appID
    };
    const query = gql`
    query ($id: ID!) {
      phApplication(where: {id: $id}){
        id
        scope
        groupName
        internalAppUrl
        rewrite
        status
      }
    }`;
    const data = await this.graphqlClient.request(query, variables);

    if (data.phApplication === null || data.phApplication.status !== 'Ready') {
      return undefined;
    }

    const internalAppUrl = new URL(data.phApplication.internalAppUrl);
    return {
      appID,
      scope: data.phApplication.scope,
      group: data.phApplication.groupName,
      target: `${internalAppUrl.protocol}//${internalAppUrl.host}`,
      rewrite: data.phApplication.rewrite,
    };
  }

  private getAppData = async (appID: string): Promise<AppData> => {
    const cachedAppData: AppData = this.phApplicationCacheStore.get(appID);
    if (cachedAppData) {
      return cachedAppData;
    }
    try {
      const appData = await this.queryAppData(appID);
      this.phApplicationCacheStore.set(appID, appData, phApplicationCacheExpireTime);
      return appData;
    } catch (error) {
      const msg = (error.response.errors) ? error.response.errors.map(e => e.message) : error;
      logger.error({
        appID,
        reason: 'getAppData failed',
        message: msg
      });
      return undefined;
    }
  }

  private handleAppWeb = async (ctx: Koa.ParameterizedContext, next: any) => {
    const appID = ctx.params.appID;
    const prefix = `${this.config.appPrefix}/apps/${appID}`;
    const appData = await this.getAppData(appID);
    if (!appData) {
      return next();
    }

    if (ctx.url === prefix) {
      return ctx.redirect(ctx.url + '/');
    }

    const proxyOpts = {
      target: appData.target,
      changeOrigin: true,
      urlRewrite: appData.rewrite ?
        path => path.slice(prefix.length) :
        path => path
    };

    switch (appData.scope) {
      case 'group':
      case 'primehub':
        const sessionToken = ctx.cookies.get('phapplication-session-id', {signed: true}) || '';
        const cachedSessionToken = this.sessionTokenCacheStore.get(sessionToken);
        if (!cachedSessionToken) {
          // authentication and authorization
          return this.oidcCtrl.loggedIn(ctx, async () => {
            if (appData.scope === 'group') {
              const isGroupMember = await this.isMemberOfGroup(ctx.state.userId, appData.group);
              if (isGroupMember === false) {
                throw Boom.forbidden('Request not authorized');
              }
            }
            this.createSessionToken(ctx);
            return ctx.redirect(ctx.url);
          });
        }
        this.updateSessionTTL(ctx);
        await this.proxyWeb(ctx, proxyOpts);
        break;
      case 'public':
        await this.proxyWeb(ctx, proxyOpts);
        break;
      default:
        throw Boom.badRequest('bad request');
    }
  }

  private handleFiles = async (ctx: Koa.ParameterizedContext, next: any) => {
    const target = this.apiTarget;
    const urlRewrite = path => {
      if (this.config.appPrefix) {
        path = path.slice(this.config.appPrefix.length);
        path = this.apiPrefix + path;
      }
      return path;
    };
    await this.proxyWeb(ctx, {
      target,
      changeOrigin: true,
      urlRewrite,
    });
  }

  public createUpgradeHandler = () => {
    const match = route(`${this.config.appPrefix}/apps/:appID/(.*)`);

    // node-http-proxy: proxy the websocket
    //
    // Ref:
    //   https://github.com/http-party/node-http-proxy#proxying-websockets
    //   https://nodejs.org/api/http.html#http_event_upgrade_1
    return async (req, socket, head) => {
      const params = match(req.url);
      if (!params) {
        return;
      }

      const {appID} = params;
      const appData = await this.getAppData(appID);
      if (!appData) {
        return;
      }

      const oldPath = req.url;
      if (appData.rewrite) {
        const prefix = `${this.config.appPrefix}/apps/${appID}`;
        req.url = req.url.slice(prefix.length);
      }

      const proxyOpts = {
        target: appData.target,
        changeOrigin: true,
      };

      logger.debug({
        component: logger.components.proxy,
        type: 'PROXY_WS',
        from: oldPath,
        to: new URL(req.url, proxyOpts.target),
      });

      this.proxy.ws(req, socket, head, proxyOpts, e => {
        logger.error({
          component: logger.components.proxy,
          type: 'PROXY_WS_ERROR',
          error: e,
        });
      });
    };
  }

  public mount(rootRouter) {
    rootRouter.all(`/apps/:appID`, this.handleAppWeb);
    rootRouter.all(`/apps/:appID/(.*)`, this.handleAppWeb);
    rootRouter.all(`/files/(.*)`, this.oidcCtrl.loggedIn, this.handleFiles);
  }
}
