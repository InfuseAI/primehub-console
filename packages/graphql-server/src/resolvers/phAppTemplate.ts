import fetch from 'node-fetch';
import yaml from 'js-yaml';
import { get } from 'lodash';
import { ApolloError } from 'apollo-server';
import { Context } from './interface';
import { toRelay, filter, paginate, extractPagination } from './utils';
import { PhAppTemplateSpec, client as kubeClient } from '../crdClient/crdClientImpl';
import CustomResource, { Item } from '../crdClient/customResource';

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
      rewrite?: boolean;
    }
  };
}

export const transform = async (item: Item<PhAppTemplateSpec>): Promise<PhAppTemplate> => {
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
    const transformed = await transform(phAppTemplate);
    return [transformed];
  }

  const phAppTemplates = await client.list();
  const transformedPhAppTemplates = await Promise.all(
    phAppTemplates.map(item => transform(item)));

  return filter(transformedPhAppTemplates, {where});
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
    await transform(phAppTemplate);
  return transformed;
};

const fetchPhAppTemplate = async (url: any) => {
  if (!url) {
    throw new ApolloError('URL is required');
  }

  const response = await fetch(url);
  const content = await response.text();
  const templates = yaml.safeLoadAll(content);
  const template = get(templates, '[0]');

  if (template.kind === 'PhAppTemplate') {
    return template;
  }

  throw new ApolloError('Invalid PhAppTemplate yaml');
};

export const importFromURL = async (root, args, context: Context) => {
  const { crdClient } = context;
  const template = await fetchPhAppTemplate(args.url);
  const { metadata, spec } = template;

  if (metadata && spec) {
    return crdClient.phAppTemplates.create(metadata, spec);
  }

  throw new ApolloError('Invalid PhAppTemplate yaml');
};

export const updateFromURL = async (root, args, context: Context) => {
  const { crdClient } = context;
  const template = await fetchPhAppTemplate(args.url);
  const { metadata, spec } = template;

  if (metadata && spec) {
    return crdClient.phAppTemplates.patch(args.where.id, {metadata, spec});
  }

  throw new ApolloError('Invalid PhAppTemplate yaml');
};
