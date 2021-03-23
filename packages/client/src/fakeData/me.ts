export const me = {
  apiTokenCount: 1,
  groups: [{
    __typename: 'Group',
    id: 'groupId1',
    name: 'group1',
    displayName: 'c-Group 1',
    enabledDeployment: true,
    instanceTypes: [{
      id: 'g-it1',
      name: 'IT1',
      displayName: 'group1 it',
      description: 'Basic instance.'
    }],
    images: [{
      id: 'image-1',
      name: 'image-test',
      displayName: 'Group image test',
      url: 'cpucpu',
      type: 'cpu',
      urlForGpu: null,
      groupName: 'group1'
    }],
    resourceStatus: {
      cpuUsage: 0,
      gpuUsage: 0,
      memUsage: 0
    },
    datasets: [],
    jobDefaultActiveDeadlineSeconds: 86400,
  }, {
    __typename: 'Group',
    id: 'groupId2',
    name: 'group2',
    displayName: 'Group 2',
    instanceTypes: [{
      id: 'ggit1',
      name: 'IT1',
      displayName: 'group2 it'
    }],
    images: [{
      id: 'ggit2',
      name: 'IT1',
      displayName: 'group2 im',
    }],
    resourceStatus: {
      cpuUsage: 1,
      gpuUsage: 0,
      memUsage: 0
    },
  }, {
    __typename: 'Group',
    id: 'everyone',
    name: 'everyone',
    displayName: 'Group DisplayName',
    instanceTypes: [{
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    }, {
      id: 'everyone-it2',
      name: 'it',
      displayName: 'gpu1',
      gpuLimit: 1
    }],
    images: [{
      id: 'everyone-image',
      name: 'b-cpu',
      displayName: 'b-cpu',
      type: 'cpu'
    }, {
      id: 'everyone-image2',
      name: 'a-gpu',
      displayName: 'a-gpu',
      type: 'gpu'
    }, {
      id: 'everyone-image3',
      name: 'c-img',
      displayName: 'c-img',
      type: 'both'
    }]
  }]
};

export default me;
