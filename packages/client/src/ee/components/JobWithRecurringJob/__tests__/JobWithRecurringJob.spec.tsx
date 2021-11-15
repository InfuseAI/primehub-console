import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';
import { render, screen } from 'test/test-utils';

import JobWithRecurringJob from '..';
import { GroupContextValue, GroupContext } from 'context/group';
import { PhJobsConnection } from 'queries/PhJob.graphql';
import { PhSchedulesConnection } from 'queries/PhRecurringJob.graphql';

function setup() {
  const mockGroupContext: GroupContextValue = {
    id: 'cat',
    name: 'Cat',
    displayName: 'Cat',
    admins: 'admin',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  const mockConnection = [
    {
      request: {
        query: PhJobsConnection,
        variables: {
          page: 1,
          where: {
            groupId_in: [mockGroupContext.id],
            search: '',
            mine: false,
          },
          orderBy: {},
        },
      },
      result: {
        data: {
          phJobsConnection: {
            pageInfo: {
              currentPage: 1,
              totalPage: 1,
              __typename: 'PageInfo',
            },
            edges: [
              {
                cursor: 'job-202111120215-2fnrfo',
                node: {
                  id: 'job-202111120215-2fnrfo',
                  displayName: 'pj-simple-job',
                  cancel: null,
                  command: "echo 'hi'",
                  groupId: 'cat',
                  groupName: 'Cat',
                  schedule: null,
                  image: '00001',
                  instanceType: {
                    id: 'cpu-half',
                    name: 'cpu-half',
                    displayName: 'CPU 0.5',
                    cpuLimit: 0.5,
                    memoryLimit: 1,
                    gpuLimit: 0,
                    __typename: 'InstanceType',
                  },
                  userId: 'fd8d9c37-eb54-4f66-a039-2aa96411f36b',
                  userName: 'pj',
                  phase: 'Succeeded',
                  reason: 'PodSucceeded',
                  message: 'Job completed',
                  createTime: '2021-11-12T02:15:25Z',
                  startTime: '2021-11-12T02:15:44Z',
                  finishTime: '2021-11-12T02:15:45Z',
                  logEndpoint:
                    'http://localhost:3001/logs/namespaces/hub/phjobs/job-202111120215-2fnrfo',
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
    {
      request: {
        query: PhSchedulesConnection,
        variables: {
          page: 1,
          orderBy: {},
          where: {
            groupId_in: [mockGroupContext.id],
            search: '',
            mine: false,
          },
        },
      },
      result: {
        data: {
          phSchedulesConnection: {
            edges: [
              {
                cursor: 'schedule-gxwyr1',
                node: {
                  id: 'schedule-gxwyr1',
                  displayName: 'pj-simple-recurring-job',
                  invalid: false,
                  message: null,
                  command: "echo 'hi'",
                  groupId: 'cat',
                  groupName: 'Cat',
                  image: '00001',
                  userId: 'fd8d9c37-eb54-4f66-a039-2aa96411f36b',
                  userName: 'pj',
                  nextRunTime: '2021-11-30T20:00:00Z',
                  activeDeadlineSeconds: 86400,
                  recurrence: {
                    type: 'monthly',
                    cron: '0 4 1 * *',
                    __typename: 'Recurrence',
                  },
                  instanceType: {
                    id: 'cpu-half',
                    name: 'cpu-half',
                    displayName: 'CPU 0.5',
                    cpuLimit: 0.5,
                    memoryLimit: 1,
                    gpuLimit: 0,
                    __typename: 'InstanceType',
                  },
                  __typename: 'PhSchedule',
                },
                __typename: 'PhScheduleEdge',
              },
            ],
            pageInfo: {
              totalPage: 1,
              currentPage: 1,
              __typename: 'PageInfo',
            },
            __typename: 'PhScheduleConnection',
          },
        },
      },
    },
  ];

  return {
    mockGroupContext,
    mockConnection,
  };
}

describe('JobWithRecurringJob', () => {
  it('should render job list', async () => {
    const { mockGroupContext, mockConnection } = setup();

    render(
      <MemoryRouter>
        <GroupContext.Provider value={mockGroupContext}>
          <MockedProvider mocks={mockConnection}>
            <JobWithRecurringJob tab='job' />
          </MockedProvider>
        </GroupContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Jobs'
    );
    expect(await screen.findByText('pj-simple-job')).toBeInTheDocument();
  });

  it('should render recurring job list', async () => {
    const { mockGroupContext, mockConnection } = setup();

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockConnection}>
          <GroupContext.Provider value={mockGroupContext}>
            <JobWithRecurringJob tab='recurringJob' />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Recurring Jobs'
    );
    expect(
      await screen.findByText('pj-simple-recurring-job')
    ).toBeInTheDocument();
  });
});
