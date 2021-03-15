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
import {createConfig} from '../config';

const config = createConfig();

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

export const transform = async (item: Item<PhApplicationSpec, PhApplicationStatus>, kcAdminClient: KeycloakAdminClient): Promise<PhApplication> => {
  const podSpec = item.spec && item.spec.podTemplate && item.spec.podTemplate.spec;
  const svcSpec = item.spec && item.spec.svcTemplate && item.spec.svcTemplate.spec;
  // TODO: check if podSpec and svcSpec exists

  let appName = null;
  let appDefaultEnv = null;
  let svcEndpoints = [];
  let internalAppUrl = null;
  let env = null;

  const svcName = item.status && item.status.serviceName;
  if (svcName && svcSpec.ports && svcSpec.ports.length > 0) {
    svcEndpoints = svcSpec.ports.map(p => `${svcName}:${p.port}`);
  }

  if (svcName && item.spec.httpPort) {
    internalAppUrl = `http://${svcName}:${item.spec.httpPort}/console/apps/${item.metadata.name}`;
  }

  if (podSpec.containers && podSpec.containers.length > 0) {
    env = podSpec.containers[0].env;
  }

  const templateString = item.metadata && item.metadata.annotations['phapplication.primehub.io/template'];
  if (templateString) {
    const template = JSON.parse(templateString.trim());
    appName = template.metadata.name;
    appDefaultEnv = template.spec.defaultEnvs;
  }

  return {
    id: item.metadata.name,
    displayName: item.spec.displayName,
    appName,
    appDefaultEnv,
    groupName: item.spec.groupName,
    instanceType: item.spec.instanceType,
    scope: item.spec.scope,
    appUrl: `${config.graphqlHost}/console/apps/${item.metadata.name}`,
    internalAppUrl,
    svcEndpoints,
    stop: item.spec.stop,
    env,
    status: item.status ? item.status.phase : null,
    message: item.status ? item.status.message : null,
  };
};

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
    return [transformed];
  }

  const phApplications = await client.list();
  const transformedPhApplications = await Promise.all(
    phApplications.map(item => transform(item, kcAdminClient)));

  return filter(transformedPhApplications, where);
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
  return transformed;
};
