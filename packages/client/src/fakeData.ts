export const fakeData = {
  secrets: [{
    id: 'secret1',
    name: 'secret name',
    type: 'secret',
    ifDockerConfigJson: true,
  }],
  me: {
    apiTokenCount: 1,
    groups: [{
      id: 'groupId1',
      name: 'group1',
      displayName: 'c-Group 1',
      enabledDeployment: true,
      instanceTypes: [{
        id: 'g-it1',
        name: 'IT1',
        displayName: 'group1 it'
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
      }]
    }, {
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
  },
  phJobs: [{
    id: 'it1',
    name: 'IT1',
    displayName: 'IT1',
    schedule: 'it1',
    phase: 'Succeeded',
    groupid: 'groupId1',
    groupName: 'group1',
    createTime: '2019-10-04T14:48:00.000Z',
    startTime: '2019-10-04T14:48:00.000Z',
    finishTime: '2019-10-04T15:48:00.000Z',
    message: `batch1
    batch2
    batch3
    batch4
    `,
    command: `fdsf`,
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    artifact: {
      prefix: 'groups/group1/jobArtifacts/it1',
      items: [
        {
          name: 'sub/test.txt',
          size: 32623,
          lastModified: '2020-09-25T01:53:36.212Z'
        },
        {
          name: 'test.txt',
          size: 32852353,
          lastModified: '2020-09-25T01:53:36.216Z'
        }
      ]
    },
  }, {
    id: 'it2',
    name: 'IT2',
    groupId: 'group2',
    groupName: 'group2',
    instanceType: {
      id: 'no-instanceType',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    displayName: 'IT2',
    phase: 'Failed',
    message: `
    batch1
    batch2
    batch3
    batch4`,
    reason: 'PodFailed'
  }, {
    id: 'it3',
    name: 'IT3',
    displayName: 'IT3',
    groupid: 'groupId1',
    groupName: 'group1',
    phase: 'Failed',
    message: `
    batch1
    batch2
    batch3
    batch4
    Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
    File "<stdin>", line 3, in divide
  TypeError: unsupported operand type(s) for /: 'str' and 'str'`
  }, {
    id: 'it4',
    name: 'IT4',
    displayName: 'IT4',
    groupid: 'groupId1',
    groupName: 'group1',
    phase: 'Failed',
    message: `Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
    File "<stdin>", line 3, in divide
  TypeError: unsupported operand type(s) for /: 'str' and 'str'TypeError: unsupported operand type(s) for /: 'str' and 'str'
`
  }, {
    id: 'it5',
    name: 'IT5',
    displayName: 'IT5',
    groupid: 'groupId1',
    groupName: 'group1',
    phase: 'Cancelled',
    message: `Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
    File "<stdin>", line 3, in divide
  TypeError: unsupported operand type(s) for /: 'str' and 'str'TypeError: unsupported operand type(s) for /: 'str' and 'str'
`
  }],
  images: [{
    id: 'test-xis1dx',
    name: 'test',
    displayName: 'Test image',
    type: 'both',
    url: 'jupyter/base-notebook'
  }]
  ,
  phSchedules: [{
    id: 'it1',
    name: 'IT1',
    displayName: 'IT1',
    nextRunTime: '2019-12-26T14:24:22Z',
    recurrence: {
      type: 'weekly',
      cron: '* */2 * * *',
    },
    invalid: true,
    message: 'Something happened',
    command: 'haha',
    userId: 'userId',
    userName: 'phadmin',
    groupId: 'groupId1',
    groupName: 'groupName1',
    image: 'image name',
    instanceType: {
      id: 'g-it1',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
  }],
  phDeployments: [{
    id: 'd0',
    name: 'd0',
    description: 'd0',
    schedule: 'd0',
    status: 'Failed',
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
    endpointAccessType: "private",
    endpointClients: [
      {
        client: "ios"
      },
      {
        client: "android"
      }
    ],
    modelImage: 'imageurl',
    pods: [
      {name: 'model-deployment',logEndpoint: '/model-deployment'},
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
      'hello': 123
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
          'hello': 123
        },
      }
    }]
  }, {
    id: 'd1',
    name: 'd1',
    description: 'd1',
    schedule: 'd1',
    status: 'Deployed',
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
    endpointAccessType: "private",
    endpointClients: [],
    modelImage: 'imageurl',
    pods: [
      {name: 'model-deployment',logEndpoint: '/model-deployment'},
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
      'hello': 123
    }
  }, {
    id: 'id2',
    name: 'd2',
    description: 'd2',
    status: 'Deploying',
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
      {name: 'model-deployment',logEndpoint: '/model-deployment'},
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
      'hello': 123,
      'new': 'fdsafdsafdsafdsafdsafdsafdsagdsags'
    }
  }, {
    id: 'id2-stopping',
    name: 'd2',
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
      {name: 'model-deployment',logEndpoint: '/model-deployment'},
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
      'hello': 123,
      'new': 'fdsafdsafdsafdsafdsafdsafdsagdsags'
    }
  }, {
    id: 'id3',
    name: 'd3',
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
      'hello': 123,
      'new': 'fdsafdsafdsafdsafdsafdsafdsagdsags'
    }
  }],
  license: {
    "startedAt": "2018-07-21T08:19:43Z",
    "expiredAt": "2021-07-21T08:19:43Z",
    "maxGroup": 50,
    "maxNode": 10,
    "maxModelDeploy": -1,
    "licensedTo": "InfuseAI",
    "licenseStatus": "expired",
    "usage": {
      "maxGroup": 51,
      "maxNode": 10,
      "maxModelDeploy": 0
    },
  },
  files: {
    prefix: 'groups/phusers/is/fake/path',
    phfsPrefix: '/is/fake/path',
    items: [
      {
        "name": "test.png",
        "size": 423,
        "lastModified": "2020-11-09T10:00:07.143Z",
      },
      {
        "name": "test.jpg",
        "size": 13123,
        "lastModified": "2020-11-12T20:03:14.123Z",
      },
      {
        "name": "test.txt",
        "size": 51231232,
        "lastModified": "2020-12-09T10:07:07.143Z",
      },
      {
        "name": "test.ipynb",
        "size": 23136,
        "lastModified": "2021-01-23T05:07:07.143Z",
      },
      {
        "name": "test/",
        "size": 0,
        "lastModified": null,
      },
    ],
  },
};

export const schema =  {
  me: {type: 'object'},
  secrets: {type: 'array', items: {type: 'object'}},
  images: {type: 'array', items: {type: 'object'}},
  phJobs: {type: 'array', items: {type: 'object'}},
  phSchedules: {type: 'array', items: {type: 'object'}},
  phDeployments: {type: 'array', items: {type: 'object'}},
  license: {type: 'object'},
  files: {type: 'object'},
};
