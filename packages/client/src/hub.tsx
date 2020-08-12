import * as React from 'react';
import ReactDOM from 'react-dom';
import {ApolloProvider} from 'react-apollo';
import {genClient} from 'canner/lib/components/index';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {Layout, notification, Button, Skeleton} from 'antd';
import {BrowserRouter, Router, Route, Switch} from 'react-router-dom';
import styled from 'styled-components';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';
import Main from 'containers/main';
const HEADER_HEIGHT = 64;

const Content = styled(Layout.Content)`
  margin-top: ${HEADER_HEIGHT}px;
  padding: 24;
  min-height: calc(100vh - 64px);
`;

const graphqlClient = new GraphqlClient({
  uri: (window as any).graphqlEndpoint,
  fetch: (uri, options) => {
    const token = window.localStorage.getItem('canner.accessToken');
    options.headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers || {}
    };
    return fetch(uri, options);
  },
});

const fakeData = {
  secrets: [{
    id: 'secret1',
    name: 'secret name',
    type: 'secret',
    ifDockerConfigJson: true,
  }],
  me: {
    groups: [{
      id: 'groupId1',
      name: 'group1',
      displayName: 'c-Group 1',
      instanceTypes: [{
        id: 'g-it1',
        name: 'IT1',
        displayName: 'group1 it'
      }],
      images: [{
        id: 'g-it1',
        name: 'IT1',
        displayName: 'group1 im',
      }]
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
    phase: 'Running',
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
    }
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
  }]
}

const connector = new LocalStorageConnector({
  defaultData: fakeData,
  localStorageKey: 'infuse-hub'
})

const client = genClient(process.env.NODE_ENV === 'production' ?
  {graphqlClient} :
  {
    connector,
    schema: {
      me: {type: 'object'},
      secrets: {type: 'array',items: {type: 'object'}},
      phJobs: {type: 'array',items: {type: 'object'}},
      phSchedules: {type: 'array',items: {type: 'object'}},
      phDeployments: {type: 'array',items: {type: 'object'}}
    }
  });

class Hub extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <ApolloProvider client={client}>
          <Main />
        </ApolloProvider>
      </BrowserRouter>
    )
  }
}

/**
 * Background worker
 */
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    (error as any).response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

const tokenSyncWorker = new BackgroundTokenSyncer({
  appPrefix: (window as any).APP_PREFIX,
  refreshTokenExp: (window as any).refreshTokenExp,
  accessTokenExp: (window as any).accessTokenExp,
  getNewTokenSet: () => {
    return fetch(`${(window as any).APP_PREFIX}oidc/refresh-token-set`, {
      method: 'POST'
    })
    .then(checkStatus)
    .then(parseJSON);
  },
  reLoginNotify: ({loginUrl}) => {
    // notify with fixed card
    notification.warning({
      message: 'Warning',
      description: 'In less than 1 minute, you\'re going to be redirected to login page.',
      placement: 'bottomRight',
      duration: null,
      btn: (
        <Button type="primary" onClick={() => window.location.replace(`${(window as any).APP_PREFIX}oidc/logout`)}>
          Login Again
        </Button>
      ),
      key: 'refreshWarning'
    });
  }
})
tokenSyncWorker.run().catch(console.error);

// render
ReactDOM.render(
  <Hub />
, document.getElementById('root'));
