import { Context } from './interface';
import {
  toRelay, filter, paginate, extractPagination, getFromAttr, parseMemory, mergeVariables, getGroupIdsByUser
} from './utils';
import {
  PhAppTemplateSpec, client as kubeClient
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

export interface PhAppTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  docLink: string;
  icon: string;
  defaultEnvs: Array<{
    name: string;
    description: string;
    defaultValue: string;
    optional: boolean;
  }>;
  template: {
    spec: {
      podTemplate: any;
      svcTemplate: any;
      httpPort: number;
    }
  };
}

export const transform = async (item: Item<PhAppTemplateSpec>, kcAdminClient: KeycloakAdminClient): Promise<PhAppTemplate> => {
  return {
    id: item.metadata.name,
    name: item.spec.name,
    description: item.spec.description,
    version: item.spec.version,
    docLink: item.spec.docLink,
    icon: item.spec.icon,
    defaultEnvs: item.spec.defaultEnvs,
    template: item.spec.template,
  };
};

// tslint:disable-next-line:max-line-length
const listQuery = async (client: CustomResource<PhAppTemplateSpec>, where: any, context: Context): Promise<PhAppTemplate[]> => {
  const {namespace, graphqlHost, userId: currentUserId, kcAdminClient} = context;
  if (where && where.id) {
    const phAppTemplate = await client.get(where.id);
    const transformed = await transform(phAppTemplate, kcAdminClient);
    return [transformed];
  }

  const phAppTemplates = await client.list();
  const transformedPhAppTemplates = await Promise.all(
    phAppTemplates.map(item => transform(item, kcAdminClient)));

  return filter(transformedPhAppTemplates, where);
};

export const query = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phAppTemplates = await listQuery(crdClient.phAppTemplates, args && args.where, context);
  return paginate(phAppTemplates, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const {crdClient} = context;
  // tslint:disable-next-line:max-line-length
  const phAppTemplates = await listQuery(crdClient.phAppTemplates, args && args.where, context);
  return toRelay(phAppTemplates, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  const {crdClient, userId: currentUserId} = context;
  const phAppTemplate = await crdClient.phAppTemplates.get(id);
  const transformed =
    await transform(phAppTemplate, context.kcAdminClient);
  return transformed;
};
