import { Context } from './interface';
import { Item } from '../crdClient/customResource';
import { ImageSpec } from '../crdClient/crdClientImpl';
import { findResourceInGroup } from './utils';
import { EVERYONE_GROUP_ID } from './constant';
import { Crd } from './crd';

export const mapping = (item: Item<ImageSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    displayName: item.spec.displayName,
    description: item.metadata.description,
    url: item.spec.url
  };
};

export const resolveType = {
  global: async (parent, args, context: Context) => {
    // find in everyOne group
    return findResourceInGroup({
      kcAdminClient: context.kcAdminClient,
      groupId: EVERYONE_GROUP_ID,
      // id should be same with name
      resourceName: parent.id
    });
  }
};

export const crd = new Crd<ImageSpec>({
  customResourceMethod: 'images',
  propMapping: mapping,
  resolveType,
  prefixName: 'img',
  resourceName: 'image'
});
