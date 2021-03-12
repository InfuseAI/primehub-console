import { Context } from './interface';
import {
  toRelay, filter, paginate, extractPagination, getFromAttr, parseMemory, mergeVariables, getGroupIdsByUser
} from './utils';
import {
  PhApplicationSpec, PhApplicationStatus, client as kubeClient
} from '../crdClient/crdClientImpl';
import CustomResource, { Item } from '../crdClient/customResource';
import { orderBy, omit, get, isUndefined, isNil, isEmpty, isNull, capitalize, intersection } from 'lodash';
import * as moment from 'moment';
import { ApolloError } from 'apollo-server';
import KeycloakAdminClient from 'keycloak-admin';
import { mapping } from './instanceType';
import * as logger from '../logger';
import { keycloakMaxCount } from './constant';
import { isUserAdmin } from './user';
import md5 = require('apache-md5');

interface EnvVar {
  name: string;
  value: string;
}

interface DefaultEnvVar {
  name: string;
  value: string;
}

export interface PhApplication {
  id: string;
  displayName: string;
  appName: string;
  appDefaultEnv: DefaultEnvVar[];
  groupName: string;
  instanceType: string;
  scope: string;
  appUrl: string;
  internalAppUrl: string;
  svcEndpoints: string[];
  stop: boolean;
  env: EnvVar[];
  // TODO: status should be enum
  status: string;
  message: string;
}

export const transform = async (item: Item<PhApplicationSpec>, kcAdminClient: KeycloakAdminClient): Promise<PhApplication> => {
  return {
    id: item.metadata.name,
    displayName: item.spec.displayName,
    appName: 'noAppName',
    appDefaultEnv: [],
    groupName: item.spec.groupName,
    instanceType: item.spec.instanceType,
    scope: item.spec.scope,
    appUrl: 'noAppUrl',
    internalAppUrl: 'noInternalAppUrl',
    svcEndpoints: [],
    stop: item.spec.stop,
    env: [],
    status: 'noStatus',
    message: 'noMessage',
  }
}

export const typeResolvers = {
  async instanceType(parent, args, context: Context) {
    const instanceTypeId = parent.instanceType;
    if (!instanceTypeId) {
      return null;
    }

    try {
      const instanceType = await context.getInstanceType(instanceTypeId);
      return mapping(instanceType);
    } catch (error) {
      logger.info({
        component: logger.components.phApplication,
        type: 'RESOURCE_NOT_FOUND',
        id: parent.id,
        instanceTypeId
      });
      return {
        id: `${instanceTypeId}-not-found`,
        name: instanceTypeId,
        tolerations: []
      };
    }
  },
};

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<PhApplicationSpec, PhApplicationStatus>, where: any, context: Context): Promise<PhApplication[]> => {
  const {namespace, graphqlHost, userId: currentUserId, kcAdminClient} = context;
  if (where && where.id) {
    const phApplication = await client.get(where.id);
    const transformed = await transform(phApplication, kcAdminClient);
    //const viewable = await canUserView(currentUserId, transformed, context);
    //if (!viewable) {
    //  throw new ApolloError('user not auth', NOT_AUTH_ERROR);
    //}
    return [transformed];
  }

  const phApplications = await client.list();
  let transformedPhApplications = await Promise.all(
    phApplications.map(item => transform(item, kcAdminClient)));

  // sort by updateTime
  //transformedPhApplications = orderBy(transformedPhApplications, 'lastUpdatedTime', 'desc');
  //return filter(transformedPhApplications, omit(where, 'mine'));
  return transformedPhApplications;
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phApplications = await listQuery(crdClient.phApplications, args && args.where, context);
  return paginate(phApplications, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phApplications = await listQuery(crdClient.phApplications, args && args.where, context);
  return toRelay(phApplications, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient, userId: currentUserId} = context;
  const phApplication = await crdClient.phApplications.get(id);
  const transformed =
    await transform(phApplication, context.kcAdminClient);
  //const viewable = await canUserView(currentUserId, transformed, context);
  //if (!viewable) {
  //  throw new ApolloError('user not auth', NOT_AUTH_ERROR);
  //}
  return transformed;
};

