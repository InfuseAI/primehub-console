import Router from 'koa-router';
import request from 'request';
import config from '../../config';

export class UsageCtrl {
  mount(rootRouter: Router) {
    this.configureUsageReport(rootRouter,
      config.usageReportAPIHost, '/report/monthly', authenticateMiddleware, checkIsAdmin);
    this.configureUsageReport(rootRouter,
      config.usageReportAPIHost, '/report/monthly/details', authenticateMiddleware, checkIsAdmin);
  }

  configureUsageReport(rootRouter: Router, host: string, uriPrefix: string, authenticateMiddleware: any, checkIsAdmin: any) {
    rootRouter.get(uriPrefix + '/:year/:month', authenticateMiddleware, checkIsAdmin,
      async ctx => {
        const requestOptions: request.Options = {
          method: 'GET',
          uri: host + uriPrefix + '/' + ctx.params.year + '/' + ctx.params.month,
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
  }
}
