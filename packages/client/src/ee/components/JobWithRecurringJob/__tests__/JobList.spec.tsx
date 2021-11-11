import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from 'test/test-utils';

import { JobList, JobConnections, JobNode } from '../JobList';
import type { PageInfo } from '../types';

const noop = () => Promise.resolve();

function setup() {
  const fakeConnections: {
    edges: JobNode[];
    pageInfo: PageInfo;
  } = {
    edges: [
      {
        cursor: 'job-202111100356-hvs66k',
        node: {
          id: 'job-202111100356-hvs66k',
          displayName: 'Job ABC',
          cancel: null,
          command: 'echo "ABC"',
          groupId: 'cd1d0f14-72e7-4e62-ac22-56c6cd9ec174',
          groupName: 'InfuseAICat',
          schedule: null,
          image: '00001',
          instanceType: {
            id: 'cpu-half',
            name: 'cpu-half',
            displayName: 'CPU 0.5',
            cpuLimit: 0.5,
            memoryLimit: 1,
            gpuLimit: 0,
          },
          userId: 'fd8d9c37-eb54-4f66-a039-2aa96411f36b',
          userName: 'pj',
          phase: 'Succeeded',
          reason: 'PodSucceeded',
          message: 'Job completed',
          createTime: '2021-11-10T03:56:09Z',
          startTime: '2021-11-10T03:56:21Z',
          finishTime: '2021-11-10T03:56:22Z',
          logEndpoint:
            'http://localhost:3001/logs/namespaces/hub/phjobs/job-202111100356-hvs66k',
        },
      },
    ],
    pageInfo: {
      totalPage: 1,
      currentPage: 1,
    },
  };

  const fakeData: JobConnections = {
    variables: { page: 1 },
    refetch: noop,
    loading: false,
    error: undefined,
  };

  return {
    fakeData,
    fakeConnections,
  };
}

describe('JobList', () => {
  it('should render job list with loading status', () => {
    const { fakeData } = setup();

    render(
      <MemoryRouter>
        <JobList
          data={{ ...fakeData, loading: true }}
          onRerunJob={noop}
          onCloneJob={noop}
          onCancelJob={noop}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-job-list')).toBeInTheDocument();
  });

  it('should render job list with fetched data', () => {
    const { fakeData, fakeConnections } = setup();

    render(
      <MemoryRouter>
        <JobList
          data={{ ...fakeData, phJobsConnection: fakeConnections }}
          onRerunJob={noop}
          onCloneJob={noop}
          onCancelJob={noop}
        />
      </MemoryRouter>
    );

    const expectedJobName = 'Job ABC';
    expect(screen.getByText(expectedJobName)).toBeInTheDocument();
  });

  it('should re-run a job', () => {
    const { fakeData, fakeConnections } = setup();
    const mockRerunJob = jest.fn();

    render(
      <MemoryRouter>
        <JobList
          data={{ ...fakeData, phJobsConnection: fakeConnections }}
          onRerunJob={mockRerunJob}
          onCloneJob={noop}
          onCancelJob={noop}
        />
      </MemoryRouter>
    );

    const expectedJobName = 'Job ABC';
    const reRunJob = screen.getByTestId(`rerun-${expectedJobName}-job`);
    userEvent.click(reRunJob);
    expect(mockRerunJob).toBeCalled();
  });

  it('should clone a job', () => {
    const { fakeData, fakeConnections } = setup();
    const mockCloneJob = jest.fn();

    render(
      <MemoryRouter>
        <JobList
          data={{ ...fakeData, phJobsConnection: fakeConnections }}
          onRerunJob={noop}
          onCloneJob={mockCloneJob}
          onCancelJob={noop}
        />
      </MemoryRouter>
    );

    const expectedJobName = 'Job ABC';
    const cloneJob = screen.getByTestId(`clone-${expectedJobName}-job`);
    userEvent.click(cloneJob);
    expect(mockCloneJob).toBeCalled();
  });

  it('should cancel a job', () => {
    const { fakeData, fakeConnections } = setup();
    const mockCancelJob = jest.fn();

    render(
      <MemoryRouter>
        <JobList
          data={{
            ...fakeData,
            phJobsConnection: {
              ...fakeConnections,
              edges: [
                {
                  ...fakeConnections.edges[0],
                  node: {
                    ...fakeConnections.edges[0].node,
                    phase: 'Running',
                    reason: 'Running',
                    message: 'Running',
                  },
                },
              ],
            },
          }}
          onRerunJob={noop}
          onCloneJob={noop}
          onCancelJob={mockCancelJob}
        />
      </MemoryRouter>
    );

    const expectedJobName = 'Job ABC';
    const cloneJob = screen.getByTestId(`cancel-${expectedJobName}-job`);
    userEvent.click(cloneJob);
    expect(mockCancelJob).toBeCalled();
  });
});
