export const phDeployments = [
  {
    id: 'd0',
    name: 'My MLFlow',
    description: 'd0',
    schedule: 'd0',
    status: 'Error',
    creationTIme: '2019-10-04T14:48:00.000Z',
    lastUpdatedTime: '2019-10-04T14:48:00.000Z',
    message: `batch1
    batch2
    batch3
    batch4
    `,
    groupId: 'groupId1',
    groupName: 'Group1',
    endpoint: 'https://endpoint/modedeployment/example/test/1',
    endpointAccessType: 'private',
    endpointClients: [
      {
        client: 'ios'
      },
      {
        client: 'android'
      }
    ],
    modelImage: 'imageurl',
    pods: [
      {name: 'model-deployment', logEndpoint: '/model-deployment'},
      {name: 'job', logEndpoint: '/job'},
      {name: 'landing', logEndpoint: '/landing'}
    ],
    availableReplicas: 3,
    replicas: 4,
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    metadata: {
      hello: 123
    },
    history: [{
      time: new Date().toISOString(),
      deployment: {
        id: 'd0',
        user: {
          name: 'Leo'
        },
        name: 'd0',
        description: 'fdksoapfkeowpfadsangisoagdsagsgeiwagegiowagegeianogigeanogeiaogneiasogensioagenifdksoapfkeowpfadsangisoagdsagsgeiwagegiowagegeianogigeanogeiaogneiasogensioageni',
        groupName: 'Group1',
        modelImage: 'imageurl',
        replicas: 4,
        instanceType: {
          id: 'everyone-it',
          name: 'it',
          displayName: 'gpu0',
          gpuLimit: 0,
          cpuLimit: 0.5,
          memoryLimit: 4,
        },
        metadata: {
          hello: 123
        },
      }
    }]
  }, {
    id: 'd1',
    name: 'My MLFlow 2',
    description: 'd1',
    schedule: 'd1',
    status: 'Ready',
    creationTIme: '2019-10-04T14:48:00.000Z',
    lastUpdatedTime: '2019-10-04T14:48:00.000Z',
    message: `batch1
    batch2
    batch3
    batch4
    `,
    groupId: 'groupId1',
    groupName: 'Group1',
    endpoint: 'https://endpoint/mode-deployment/example/test/1',
    endpointAccessType: 'private',
    endpointClients: [],
    modelImage: 'imageurl',
    pods: [
      {name: 'model-deployment', logEndpoint: '/model-deployment'},
      {name: 'job', logEndpoint: '/job'},
      {name: 'landing', logEndpoint: '/landing'}
    ],
    availableReplicas: 3,
    replicas: 4,
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    metadata: {
      hello: 123
    }
  }, {
    id: 'id2',
    name: 'MATLAB Test',
    description: 'd2',
    status: 'Ready',
    creationTIme: '2019-10-04T14:48:00.000Z',
    lastUpdatedTime: '2019-10-04T14:48:00.000Z',
    message: `batch1
    batch2
    batch3
    batch4
    `,
    groupId: 'groupId1',
    groupName: 'Group1',
    endpoint: 'https://endpoint/mode-deployment/example/test/1',
    modelImage: 'imageurl',
    pods: [
      {name: 'model-deployment', logEndpoint: '/model-deployment'},
      {name: 'job', logEndpoint: '/job'},
      {name: 'landing', logEndpoint: '/landing'}
    ],
    availableReplicas: 3,
    replicas: 4,
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    metadata: {
      hello: 123,
      new: 'fdsafdsafdsafdsafdsafdsafdsagdsags'
    }
  }, {
    id: 'id2-stopping',
    name: 'CATLAB',
    description: 'd2',
    status: 'Stopping',
    creationTIme: '2019-10-04T14:48:00.000Z',
    lastUpdatedTime: '2019-10-04T14:48:00.000Z',
    message: `batch1
    batch2
    batch3
    batch4
    `,
    groupId: 'groupId1',
    groupName: 'Group1',
    endpoint: 'https://endpoint/mode-deployment/example/test/1',
    modelImage: 'imageurl',
    pods: [
      {name: 'model-deployment', logEndpoint: '/model-deployment'},
      {name: 'job', logEndpoint: '/job'},
      {name: 'landing', logEndpoint: '/landing'}
    ],
    availableReplicas: 3,
    replicas: 4,
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    metadata: {
      hello: 123,
      new: 'fdsafdsafdsafdsafdsafdsafdsagdsags'
    }
  }, {
    id: 'id3',
    name: 'Our gitlab',
    description: 'd3',
    status: 'Stopped',
    creationTIme: '2019-10-04T14:48:00.000Z',
    lastUpdatedTime: '2019-10-04T14:48:00.000Z',
    message: `batch1 ffsdafn fdksoanfkosafdns kofdsnaiofdnsnfsodnfidosanfdisoafidsfndsio
    batch2
    batch3
    batch4
    `,
    groupId: 'groupId1',
    groupName: 'Group1',
    endpoint: 'https://endpoint/mode-deployment/example/test/1',
    modelImage: 'imageurl',
    pods: [],
    availableReplicas: 3,
    replicas: 4,
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    metadata: {
      hello: 123,
      new: 'fdsafdsafdsafdsafdsafdsafdsagdsags'
    }
  }, {
    id: 'id4',
    name: 'My app',
    description: 'd3',
    status: 'Starting',
    creationTIme: '2019-10-04T14:48:00.000Z',
    lastUpdatedTime: '2019-10-04T14:48:00.000Z',
    message: `batch1 ffsdafn fdksoanfkosafdns kofdsnaiofdnsnfsodnfidosanfdisoafidsfndsio
    batch2
    batch3
    batch4
    `,
    groupId: 'groupId1',
    groupName: 'Group1',
    endpoint: 'https://endpoint/mode-deployment/example/test/1',
    modelImage: 'imageurl',
    pods: [],
    availableReplicas: 3,
    replicas: 4,
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    metadata: {
      hello: 123,
      new: 'fdsafdsafdsafdsafdsafdsafdsagdsags'
    }
  }
];

export default phDeployments;
