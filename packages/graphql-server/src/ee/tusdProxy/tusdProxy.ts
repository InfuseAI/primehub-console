/**
 * Dependencies
 */
import { URL } from 'url';
import HttpProxy = require('http-proxy');
import pathMatch = require('path-match');
import * as logger from '../../logger';

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
