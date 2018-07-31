import KcAdminClient from 'keycloak-admin';
import { Item } from '../crdClient/customResource';
import CrdClient, { DatasetSpec } from '../crdClient/crdClientImpl';
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
    displayName: item.spec.displayName,
    access: item.spec.access,
    type: item.spec.type,
    url: item.spec.url
  };
};

export const crd = new Crd<DatasetSpec>({
  customResourceMethod: 'datasets',
  propMapping: mapping,
  prefixName: 'ds',
  resourceName: 'dataset'
});
