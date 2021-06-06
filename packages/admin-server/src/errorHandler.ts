import { Context, Next } from 'koa';
import { createConfig } from './config';

const errorHandler = () => async (ctx: Context, next: Next) => {
  const config = createConfig();
  const staticPath = config.appPrefix ? `${config.appPrefix}/` : '/';

  try {
    await next();
  } catch (err) {
    const errorCode = (err.isBoom && err.data && err.data.code) ? err.data.code : 'INTERNAL_ERROR';
    const statusCode =
      (err.isBoom && err.output && err.output.statusCode) ? err.output.statusCode : err.status || 500;

    ctx.status = statusCode;

    // render or json
    if (ctx.accepts('html') && ctx.status === 403) {
      return ctx.render('403', {message: err.message, staticPath});
    } else {
      ctx.body = {code: errorCode, message: err.message};
    }
  }
};

export default errorHandler;
