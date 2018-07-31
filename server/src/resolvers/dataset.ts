import KcAdminClient from 'keycloak-admin';
import { Item } from '../crdClient/customResource';
import CrdClient, { DatasetSpec } from '../crdClient/crdClientImpl';
import { getFromAttr } from './utils';
import { Crd } from './crd';

interface Context {
  realm: string;
  kcAdminClient: KcAdminClient;
  crdClient: CrdClient;
}

export const mapping = (item: Item<DatasetSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    description: item.metadata.description,
    type: item.spec.type,
    url: item.spec.url
  };
};

export const resolveType = {
  access: async (parent, args, context: Context) =>
    getFromAttr('access', parent.attributes, null)
};

export const crd = new Crd<DatasetSpec>({
  customResourceMethod: 'datasets',
  propMapping: mapping,
  resolveType,
  prefixName: 'ds',
  resourceName: 'dataset'
});
