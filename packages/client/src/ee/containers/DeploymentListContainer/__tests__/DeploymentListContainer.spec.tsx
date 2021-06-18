import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import DeploymentListContainer from '..';
import { GroupContextValue } from 'context/group';
import { render, screen } from 'test/test-utils';
import { PhDeploymentsConnection } from 'queries/PhDeployment.graphql';

import { groups as mockGroups } from '../../../../fakeData/groups';

function setup() {
  const mockGroupContext: GroupContextValue = {
    id: 'groupId1',
    name: 'group1',
    displayName: 'group1',
    admins: 'test-user',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  const mockRequests = [
    {
      request: {
        query: PhDeploymentsConnection,
        variables: {
          first: 12,
          where: {
            groupId_in: [mockGroupContext.id],
          },
        },
      },
      result: {
        data: {
          phDeploymentsConnection: {
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'd0',
              endCursor: 'd0',
              __typename: 'PhDeploymentPageInfo',
            },
            edges: [
              {
                cursor: 'd0',
                node: {
                  id: 'd0',
                  status: 'Error',
                  message: 'batch1\n    batch2\n    batch3\n    batch4\n    ',
                  name: 'My MLflow',
                  description: 'd0',
                  updateMessage: null,
                  env: null,
                  metadata: {
                    hello: 123,
                  },
                  groupId: 'groupId1',
                  groupName: 'Group1',
                  creationTime: null,
                  lastUpdatedTime: '2019-10-04T14:48:00.000Z',
                  endpoint: 'https://endpoint/modedeployment/example/test/1',
                  endpointAccessType: 'private',
                  endpointClients: [
                    {
                      name: null,
                      __typename: null,
                    },
                    {
                      name: null,
                      __typename: null,
                    },
                  ],
                  modelImage: 'imageurl',
                  modelURI: 'phfs:///model/path',
                  pods: [
                    {
                      name: 'model-deployment',
                      logEndpoint: '/model-deployment',
                      __typename: null,
                    },
                    {
                      name: 'job',
                      logEndpoint: '/job',
                      __typename: null,
                    },
                    {
                      name: 'landing',
                      logEndpoint: '/landing',
                      __typename: null,
                    },
                  ],
                  availableReplicas: 3,
                  replicas: 4,
                  imagePullSecret: null,
                  instanceType: {
                    id: 'everyone-it',
                    name: 'it',
                    displayName: 'gpu0',
                    cpuLimit: 0.5,
                    memoryLimit: 4,
                    gpuLimit: 0,
                    __typename: null,
                  },
                  history: [
                    {
                      deployment: {
                        id: 'd0',
                        userName: null,
                        stop: null,
                        modelImage: 'imageurl',
                        modelURI: null,
                        replicas: 4,
                        groupName: 'Group1',
                        description: 'Hello World',
                        updateMessage: null,
                        metadata: {
                          hello: 123,
                        },
                        env: null,
                        endpointClients: null,
                        endpointAccessType: null,
                        instanceType: {
                          id: 'everyone-it',
                          name: 'it',
                          displayName: 'gpu0',
                          cpuLimit: 0.5,
                          memoryLimit: 4,
                          gpuLimit: 0,
                          __typename: null,
                        },
                        __typename: null,
                      },
                      time: '2021-06-08T09:13:07.788Z',
                      __typename: null,
                    },
                  ],
                  __typename: 'PhDeployment',
                },
                __typename: 'PhDeploymentEdge',
              },
            ],
            __typename: 'PhDeploymentConnection',
          },
        },
      },
    },
  ];

  return {
    mockGroupContext,
    mockRequests,
  };
}

describe('DeploymentListContainer', () => {
  it('should render deployment list container with loading status', () => {
    const { mockGroupContext } = setup();

    render(
      <MockedProvider>
        <MemoryRouter>
          <DeploymentListContainer
            groups={mockGroups}
            groupContext={mockGroupContext}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should render deployment list container with error message', async () => {
    const { mockGroupContext } = setup();

    render(
      <MockedProvider>
        <MemoryRouter>
          <DeploymentListContainer
            groups={mockGroups}
            groupContext={mockGroupContext}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.findByText('Error')).toBeInTheDocument();
  });

  it('should render deployment list container and get deployment', async () => {
    const { mockGroupContext, mockRequests } = setup();

    render(
      <MockedProvider mocks={mockRequests}>
        <MemoryRouter>
          <DeploymentListContainer
            groups={mockGroups}
            groupContext={mockGroupContext}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.findByText('Create Deployment')).toBeInTheDocument();
    expect(await screen.findByText('Refresh')).toBeInTheDocument();
    expect(await screen.findByText('My MLflow')).toBeInTheDocument();
  });
});
