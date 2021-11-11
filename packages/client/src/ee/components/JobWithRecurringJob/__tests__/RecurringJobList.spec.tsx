import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from 'test/test-utils';

import {
  RecurringJobList,
  RecurringJobConnections,
  RecurringJobNode,
} from '../RecurringJobList';
import type { PageInfo } from '../types';

const noop = () => Promise.resolve();

function setup() {
  const fakeConnections: {
    edges: RecurringJobNode[];
    pageInfo: PageInfo;
  } = {
    edges: [
      {
        cursor: 'schedule-7gwov7',
        node: {
          id: 'schedule-7gwov7',
          displayName: 'This is a recurring job',
          invalid: false,
          message: 'This phSchedule is inactive',
          command: 'echo "test!"',
          groupId: 'cd1d0f14-72e7-4e62-ac22-56c6cd9ec174',
          groupName: 'InfuseAICat',
          image: 'ai-notebook',
          userId: 'd1bb1d50-fa77-4f85-a58b-edf3698d757e',
          userName: 'ericy',
          nextRunTime: null,
          activeDeadlineSeconds: 3600,
          recurrence: {
            type: 'inactive',
            cron: '',
          },
          instanceType: {
            id: 'cpu-1',
            name: 'cpu-1',
            displayName: 'CPU 1',
            cpuLimit: 1,
            memoryLimit: 2,
            gpuLimit: 0,
          },
        },
      },
    ],
    pageInfo: {
      totalPage: 1,
      currentPage: 1,
    },
  };

  const fakeData: RecurringJobConnections = {
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

describe('RecurringJobList', () => {
  it('should rend recurring job list with loading status', () => {
    const { fakeData } = setup();

    render(
      <MemoryRouter>
        <RecurringJobList
          data={{ ...fakeData, loading: true }}
          onRunRecurringJob={noop}
          onEditRecurringJob={noop}
          onDeleteRecurringJob={noop}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByTestId('loading-recurring-job-list')
    ).toBeInTheDocument();
  });

  it('should render recurring job list with fetched data', () => {
    const { fakeData, fakeConnections } = setup();

    render(
      <MemoryRouter>
        <RecurringJobList
          data={{ ...fakeData, phSchedulesConnection: fakeConnections }}
          onRunRecurringJob={noop}
          onEditRecurringJob={noop}
          onDeleteRecurringJob={noop}
        />
      </MemoryRouter>
    );

    const expectedRecurringJobName = 'This is a recurring job';
    expect(screen.getByText(expectedRecurringJobName)).toBeInTheDocument();
  });

  it('should run a recurring job', () => {
    const { fakeData, fakeConnections } = setup();
    const mockRunRecurringJob = jest.fn();

    render(
      <MemoryRouter>
        <RecurringJobList
          data={{ ...fakeData, phSchedulesConnection: fakeConnections }}
          onRunRecurringJob={mockRunRecurringJob}
          onEditRecurringJob={noop}
          onDeleteRecurringJob={noop}
        />
      </MemoryRouter>
    );

    const expectedRecurringJobName = 'This is a recurring job';
    const runRecurringJob = screen.getByTestId(
      `run-${expectedRecurringJobName}-recurring-job`
    );
    userEvent.click(runRecurringJob);
    expect(mockRunRecurringJob).toBeCalled();
  });

  it('should edit a recurring job', () => {
    const { fakeData, fakeConnections } = setup();
    const mockEditRecurringJob = jest.fn();

    render(
      <MemoryRouter>
        <RecurringJobList
          data={{ ...fakeData, phSchedulesConnection: fakeConnections }}
          onRunRecurringJob={noop}
          onEditRecurringJob={mockEditRecurringJob}
          onDeleteRecurringJob={noop}
        />
      </MemoryRouter>
    );

    const expectedRecurringJobName = 'This is a recurring job';
    const editRecurringJob = screen.getByTestId(
      `edit-${expectedRecurringJobName}-recurring-job`
    );
    userEvent.click(editRecurringJob);
    expect(mockEditRecurringJob).toBeCalled();
  });

  it('should delete a recurring job', () => {
    const { fakeData, fakeConnections } = setup();
    const mockDeleteRecurringJob = jest.fn();

    render(
      <MemoryRouter>
        <RecurringJobList
          data={{ ...fakeData, phSchedulesConnection: fakeConnections }}
          onRunRecurringJob={noop}
          onEditRecurringJob={noop}
          onDeleteRecurringJob={mockDeleteRecurringJob}
        />
      </MemoryRouter>
    );

    const expectedRecurringJobName = 'This is a recurring job';
    const deleteRecurringJob = screen.getByTestId(
      `delete-${expectedRecurringJobName}-recurring-job`
    );
    userEvent.click(deleteRecurringJob);
    expect(mockDeleteRecurringJob).toBeCalled();
  });
});
