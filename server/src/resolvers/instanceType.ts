import { Context } from './interface';
import { Item } from '../crdClient/customResource';
import { InstanceTypeSpec } from '../crdClient/crdClientImpl';
import { findResourceInGroup } from './utils';
import { EVERYONE_GROUP_ID } from './constant';
import { Crd } from './crd';

export const mapping = (item: Item<InstanceTypeSpec>) => {
  return {
    id: item.metadata.name,
    name: item.metadata.name,
    description: item.metadata.description,
    displayName: item.spec.displayName,
    cpuLimit: item.spec['limits.cpu'],
    memoryLimit: item.spec['limits.memory'],
    gpuLimit: item.spec['limits.nvidia.com/gpu'] || 0,
    cpuRequest: item.spec['requests.cpu'],
    memoryRequest: item.spec['requests.memory']
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

export const crd = new Crd<InstanceTypeSpec>({
  customResourceMethod: 'instanceTypes',
  propMapping: mapping,
  resolveType,
  prefixName: 'it',
  resourceName: 'instanceType'
});
