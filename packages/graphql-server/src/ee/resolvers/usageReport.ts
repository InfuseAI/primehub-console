import { Context } from '../../resolvers/interface';
import { toRelay, filter, paginate, extractPagination } from '../../resolvers/utils';
import * as logger from '../../logger';
import { omit } from 'lodash';
import request from 'request';
import { kubeConfig } from '../../crdClient/crdClientImpl';
import moment from 'moment';

/**
 * Query
 */

const makeRequest = (requestOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (response.statusCode !== 200) {
        reject('Invalid status code <' + response.statusCode + '>');
      }
      resolve(body);
    });
  });
};

const listQuery = async (context: Context, where: any, order: any) => {
  const {usageReportAPIHost, graphqlHost, appPrefix} = context;
  const requestOptions: request.Options = {
    method: 'GET',
    uri: usageReportAPIHost + '/report/monthly',
  };
  kubeConfig.applyToRequest(requestOptions);

  try {
    const response = await makeRequest(requestOptions);
    const json = JSON.parse(response);
    const elements = json.map(element =>
      ({
        id: moment(element).format('YYYY/MM'),
        detailedUrl: `${graphqlHost}${appPrefix || ''}/report/monthly/details/${element}`,
        summaryUrl: `${graphqlHost}${appPrefix || ''}/report/monthly/${element}`
    }));
    if (!order) {
      order = {
        id: 'desc'
      };
    }
    return filter(elements, where, order);
  } catch (error) {
    logger.error({
      component: logger.components.usageReport,
      type: 'USAGE_REPORT_LIST_ERROR',
      error
    });
    return [];
  }
};

export const query = async (root, args, context: Context) => {
  const usageReports = await listQuery(context, args && omit(args.where, 'workspaceId'), args && args.orderBy);
  return paginate(usageReports, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const usageReports = await listQuery(context, args && omit(args.where, 'workspaceId'), args && args.orderBy);
  return toRelay(usageReports, extractPagination(args));
};
