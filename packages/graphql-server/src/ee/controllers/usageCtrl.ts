import Boom from 'boom';
import { Middleware, ParameterizedContext } from 'koa';
import Router from 'koa-router';
import request from 'request';
import config from '../../config';
import { Role } from '../../resolvers/interface';
import * as logger from '../../logger';
import { kubeConfig } from '../../crdClient/crdClientImpl';

const checkIsAdmin = async (ctx: ParameterizedContext, next: any) => {
  if (ctx.role === Role.ADMIN) {
    return next();
  }
  throw Boom.forbidden('request not authorized');
};

export const mountUsageCtrl = (rootRouter: Router, usageReportAPIHost: string, authenticateMiddleware: Middleware) => {
  const configureUsageReport = (uriPrefix: string) => {
    rootRouter.get(uriPrefix + '/:year/:month', authenticateMiddleware, checkIsAdmin,
      async ctx => {
        const requestOptions: request.Options = {
          method: 'GET',
          uri: usageReportAPIHost + uriPrefix + '/' + ctx.params.year + '/' + ctx.params.month,
        };
        kubeConfig.applyToRequest(requestOptions);
        const req = request(requestOptions);

        req.on('error', err => {
          logger.error({
            component: logger.components.internal,
            type: 'USAGE_REPORT_GET_REPORT_ERROR',
            message: err.message
          });
          ctx.res.end();
        });

        ctx.body = req;
      }
    );
  };

  configureUsageReport('/report/monthly');
  configureUsageReport('/report/monthly/details');
};
