import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import DeploymentListContainer from '..';
import { GroupContextValue, GroupContext } from 'context/group';
import { render, screen } from 'test/test-utils';

import { DeploymentsQuery } from '../deployment.graphql';
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
        query: DeploymentsQuery,
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
            edges: [
              {
                cursor: 'v-v54fm',
                node: {
                  id: 'v-v54fm',
                  status: 'Stopped',
                  name: 'Deployment One',
                  lastUpdatedTime: '2021-08-05T04:18:53.432Z',
                  endpoint:
                    'https://test.primehub.io/deployment/v-v54fm/api/v1.0/predictions',
                  history: [
                    {
                      deployment: {
                        id: 'v-v54fm-2021-08-05T00:42:27Z',
                        userName: 'bob',
                        __typename: 'PhDeployment',
                      },
                      time: '2021-08-05T00:42:27Z',
                      __typename: 'HistoryItem',
                    },
                    {
                      deployment: {
                        id: 'v-v54fm-2021-08-05T00:30:43Z',
                        userName: 'bob',
                        __typename: 'PhDeployment',
                      },
                      time: '2021-08-05T00:30:43Z',
                      __typename: 'HistoryItem',
                    },
                  ],
                  __typename: 'PhDeployment',
                },
                __typename: 'PhDeploymentEdge',
              },
              {
                cursor: 'v-8ukkq',
                node: {
                  id: 'v-8ukkq',
                  status: 'Stopped',
                  name: 'Deployment Two',
                  lastUpdatedTime: '2021-08-03T02:55:52.010Z',
                  endpoint:
                    'https://test.primehub.io/deployment/v-8ukkq/api/v1.0/predictions',
                  history: [
                    {
                      deployment: {
                        id: 'v-8ukkq-2021-08-03T02:55:52Z',
                        userName: 'alice',
                        __typename: 'PhDeployment',
                      },
                      time: '2021-08-03T02:55:52Z',
                      __typename: 'HistoryItem',
                    },
                    {
                      deployment: {
                        id: 'v-8ukkq-2021-08-03T02:55:24Z',
                        userName: 'alice',
                        __typename: 'PhDeployment',
                      },
                      time: '2021-08-03T02:55:24Z',
                      __typename: 'HistoryItem',
                    },
                  ],
                  __typename: 'PhDeployment',
                },
                __typename: 'PhDeploymentEdge',
              },
              {
                cursor: 'tf2-test-w5tlj',
                node: {
                  id: 'tf2-test-w5tlj',
                  status: 'Stopped',
                  name: 'Deployment Three',
                  lastUpdatedTime: '2021-07-30T02:32:02.810Z',
                  endpoint:
                    'https://test.primehub.io/deployment/tf2-test-w5tlj/api/v1.0/predictions',
                  history: [
                    {
                      deployment: {
                        id: 'tf2-test-w5tlj-2021-07-30T02:32:02Z',
                        userName: 'jacky',
                        __typename: 'PhDeployment',
                      },
                      time: '2021-07-30T02:32:02Z',
                      __typename: 'HistoryItem',
                    },
                  ],
                  __typename: 'PhDeployment',
                },
                __typename: 'PhDeploymentEdge',
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'v-v54fm',
              endCursor: 'pytorch-test-123456',
              __typename: 'PageInfo',
            },
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
  it('should render did not authorized group message', async () => {
    const { mockGroupContext, mockRequests } = setup();
    const withFakeGroup = {
      ...mockGroupContext,
      id: 'fake-group',
    };

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <GroupContext.Provider value={withFakeGroup}>
            <DeploymentListContainer groups={mockGroups} />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Group group1 is not found or not authorized.')
    ).toBeInTheDocument();
  });

  it('should render did not enabled feature message', async () => {
    const { mockGroupContext, mockRequests } = setup();
    const tmpGroups = mockGroups.map((group) => {
      if (group.id === mockGroupContext.id) {
        return {
          ...group,
          enabledDeployment: false,
        };
      }
      return { ...group };
    });

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <GroupContext.Provider value={mockGroupContext}>
            <DeploymentListContainer groups={tmpGroups} />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText(
        'Model Deployment is not enabled for this group. Please contact your administrator to enable it.'
      )
    ).toBeInTheDocument();
  });

  it('should render deployment list container with error message', async () => {
    const { mockGroupContext } = setup();

    render(
      <MemoryRouter>
        <MockedProvider>
          <GroupContext.Provider value={mockGroupContext}>
            <DeploymentListContainer groups={mockGroups} />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Failure to load deployments.')
    ).toBeInTheDocument();
  });

  it('should render deployments', async () => {
    const { mockGroupContext, mockRequests } = setup();

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <GroupContext.Provider value={mockGroupContext}>
            <DeploymentListContainer groups={mockGroups} />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Deployment One')).toBeInTheDocument();
    expect(await screen.findByText('Deployment Two')).toBeInTheDocument();
    expect(await screen.findByText('Deployment Three')).toBeInTheDocument();
  });
});
