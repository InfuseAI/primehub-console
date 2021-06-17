import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import JobListContainer from 'ee/containers/JobListContainer';
import { GroupContextValue } from 'context/group';
import { render, screen } from 'test/test-utils';
import { PhJobsConnection } from 'queries/PhJob.graphql';

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
        query: PhJobsConnection,
        variables: {
          where: {
            groupId_in: [mockGroupContext.id],
          },
          orderBy: {},
          page: 1,
        },
      },
      result: {
        data: {
          phJobsConnection: {
            pageInfo: {
              totalPage: 1,
              currentPage: 1,
              __typename: 'PhJobPageInfo',
            },
            edges: [
              {
                cursor: 'it1',
                node: {
                  id: 'it1',
                  displayName: 'IT1',
                  cancel: null,
                  command: 'fdsf',
                  groupId: 'groupId1',
                  groupName: 'group1',
                  schedule: 'it1',
                  image: null,
                  instanceType: {
                    id: 'everyone-it',
                    name: 'it',
                    displayName: 'gpu0',
                    cpuLimit: 0.5,
                    memoryLimit: 4,
                    gpuLimit: 0,
                    __typename: null,
                  },
                  userId: 'test-user',
                  userName: 'test-user',
                  phase: 'Succeeded',
                  reason: null,
                  message: 'batch1\n    batch2\n    batch3\n    batch4\n    ',
                  createTime: '2019-10-04T14:48:00.000Z',
                  startTime: '2019-10-04T14:48:00.000Z',
                  finishTime: '2019-10-04T15:48:00.000Z',
                  logEndpoint: null,
                  __typename: 'PhJob',
                },
                __typename: 'PhJobEdge',
              },
            ],
            __typename: 'PhJobConnection',
          },
        },
      },
    },
  ];

  return {
    mockRequests,
    mockGroupContext,
  };
}

describe('JobListContainer', () => {
  it('should render job list container with table column', () => {
    const { mockGroupContext } = setup();

    render(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <JobListContainer groupContext={mockGroupContext} />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Job name')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Timing')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should render job list container with job name', async () => {
    const { mockRequests, mockGroupContext } = setup();

    render(
      <MockedProvider mocks={mockRequests}>
        <MemoryRouter>
          <JobListContainer groupContext={mockGroupContext} />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Job name')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Timing')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();

    const expectJobName = await screen.findByText('IT1');
    const expectUsername = await screen.findByText('test-user');
    const expectSchedue = await screen.findByText('it1');

    expect(expectJobName).toBeInTheDocument();
    expect(expectUsername).toBeInTheDocument();
    expect(expectSchedue).toBeInTheDocument();
  });
});
