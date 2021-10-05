/**
 * Dependencies
 */
import { URL } from 'url';
import HttpProxy = require('http-proxy');
import pathMatch = require('path-match');
import * as logger from '../logger';
import Boom = require('boom');
import Koa, {Context, Middleware} from 'koa';
import Router = require('koa-router');
import { isGroupBelongUser, toGroupPath } from '../utils/groupCheck';

/**
 * Constants
 */
const route = pathMatch({
  // path-to-regexp options
  sensitive: false,
  strict: false,
  end: false
});

let eventRegistered = false;

/**
 * Koa Http Proxy Middleware
 * from: https://github.com/vagusX/koa-proxies
 */
export const TusdProxy = (path, options) => (ctx, next) => {
  let forwardedHost = '';
  let forwardedProto = '';
  if (options.graphqlHost.startsWith('http://')) {
    forwardedHost = options.graphqlHost.replace('http://', '');
    forwardedProto = 'http';
  } else if (options.graphqlHost.startsWith('https://')) {
    forwardedHost = options.graphqlHost.replace('https://', '');
    forwardedProto = 'https';
  } else {
    throw new Error(`${options.graphqlHost} should start with http|https`);
  }

  const proxy = HttpProxy.createProxyServer({
    headers: {
      'X-Forwarded-Host': forwardedHost + options.tusProxyPath,
      'X-Forwarded-Proto': forwardedProto
    }
  });

  // create a match function
  const match = route(path);
  if (!match(ctx.path)) {
    return next();
  }

  let opts = {...options};
  if (typeof options === 'function') {
    const params = match(ctx.path);
    opts = options.call(options, params);
  }
  // object-rest-spread is still in stage-3
  // https://github.com/tc39/proposal-object-rest-spread
  const { logs, rewrite, events } = opts;

  const httpProxyOpts = Object.keys(opts)
    .filter(n => ['logs', 'rewrite', 'events'].indexOf(n) < 0)
    .reduce((prev, cur) => {
      prev[cur] = opts[cur];
      return prev;
    }, {});

  return new Promise((resolve, reject) => {
    ctx.req.oldPath = ctx.req.url;

    if (typeof rewrite === 'function') {
      ctx.req.url = rewrite(ctx.req.url, ctx);
    }

    if (logs) {
      typeof logs === 'function' ? logs(ctx, opts.target) : debug(ctx, opts.target);
    }
    if (events && typeof events === 'object' && !eventRegistered) {
      Object.entries(events).forEach(([event, handler]) => {
        proxy.on(event, handler);
      });
      eventRegistered = true;
    }

    // Let the promise be solved correctly after the proxy.web.
    // The solution comes from https://github.com/nodejitsu/node-http-proxy/issues/951#issuecomment-179904134
    ctx.res.on('close', () => {
      reject(new Error(`Http response closed while proxying ${ctx.req.oldPath}`));
    });

    ctx.res.on('finish', () => {
      resolve();
    });

    proxy.web(ctx.req, ctx.res, httpProxyOpts, e => {
      const status = {
        ECONNREFUSED: 503,
        ETIMEOUT: 504
      }[e.code];
      ctx.status = status || 500;
      resolve();
    });
  });
};

function debug(ctx, target) {
  logger.info({
    date: new Date().toISOString(),
    method: ctx.req.method,
    oldPath: ctx.req.oldPath,
    newPath: new URL(ctx.req.url, target)
  });
}

const checkTusPermission = async (ctx: Koa.ParameterizedContext, next: any) => {

  // only verify if method is POST
  if (ctx.request.method !== 'POST') {
    return next();
  }

  // validate user permissions ctx.headers["upload-metadata"]
  // validate header 'Upload-Metadata' should contains dirpath
  // dirpath is a group path matching the pattern: groups/${group}/upload
  const uploadMetadata = ctx.headers['upload-metadata'];
  if (!uploadMetadata) {
    console.warn('upload-metadata header not found');
    throw Boom.badRequest('upload-metadata header not found');
  }

  // get dirpath from header
  const regex = new RegExp('dirpath ([^,]+),?');
  const result = regex.exec(uploadMetadata);
  if (!result) {
    console.warn('dirpath not found in the upload-metadata header', uploadMetadata);
    throw Boom.badRequest('dirpath not found in the upload-metadata header');
  }
  const dirPath = Buffer.from(result[1], 'base64').toString();

  const uploadGroup = new RegExp('groups/([^/]+)/').exec(dirPath);
  if (!uploadGroup) {
    console.warn('there is no group name in the dirpath', dirPath);
    throw Boom.badRequest('there is no group name in the dirpath');
  }

  const groupName = uploadGroup[1];
  if (groupName !== toGroupPath(groupName)) {
    console.warn(`the group name in the dirpath should have no capital characters and _': ${groupName}`);
    throw Boom.badRequest(`the group name in the dirpath should have no capital characters and _': ${groupName}`);
  }

  const userHasGroup = await isGroupBelongUser(ctx, ctx.userId, groupName) === true;
  if (userHasGroup) {
    return next();
  }
  console.warn('user might not have the group', groupName);

  throw Boom.forbidden('request not authorized');
};

export const mountTusCtrl = (router: Router, tusProxyPath: string, config, authenticateMiddleware: Middleware) => {
  router.all(`/tus(/?.*)`, authenticateMiddleware, checkTusPermission, TusdProxy(tusProxyPath, {
    target: config.sharedSpaceTusdEndpoint,
    changeOrigin: true,
    logs: true,
    graphqlHost: config.graphqlHost,
    tusProxyPath,
    rewrite: rewritePath => rewritePath.replace(tusProxyPath, '').replace('/files/', ''),
  }));
};
