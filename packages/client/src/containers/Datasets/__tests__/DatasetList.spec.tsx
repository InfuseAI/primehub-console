import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { DatasetList } from '..';
import { GroupContextValue, GroupContext } from 'context/group';
import { render, screen } from 'test/test-utils';

import { GetDatasets } from '../dataset.graphql';
import { groups as mockGroups } from '../../../fakeData/groups';
import { datasetsV2 } from '../../../fakeData/datasetsV2';

function setup() {
  const mockGroupContext: GroupContextValue = {
    id: 'groupId1',
    name: 'group1',
    displayName: 'group1',
    admins: 'test-user',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  const edges = datasetsV2.map(dataset => {
    return {
      node: dataset,
      cursor: dataset.id,
      __typename: 'DatasetV2Edge',
    };
  });

  const mockRequests = [
    {
      request: {
        query: GetDatasets,
        variables: {
          page: 1,
          where: {
            groupName: mockGroupContext.name,
          },
        },
      },
      result: {
        data: {
          datasetV2Connection: {
            edges,
            pageInfo: {
              currentPage: 1,
              totalPage: 2,
              __typename: 'PageInfo',
            },
            __typename: 'DatasetV2Connection',
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

describe('Datasets V2 List', () => {
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
            <DatasetList groups={mockGroups} />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Group group1 is not found or not authorized.')
    ).toBeInTheDocument();
  });

  it('should render datasets with error message', async () => {
    const { mockGroupContext } = setup();

    render(
      <MemoryRouter>
        <MockedProvider>
          <GroupContext.Provider value={mockGroupContext}>
            <DatasetList groups={mockGroups} />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Failure to load datasets.')
    ).toBeInTheDocument();
  });

  it('should render datasets', async () => {
    const { mockGroupContext, mockRequests } = setup();

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <GroupContext.Provider value={mockGroupContext}>
            <DatasetList groups={mockGroups} />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Dataset One')).toBeInTheDocument();
    expect(await screen.findByText('Dataset Two')).toBeInTheDocument();
    expect(await screen.findByText('Dataset Three')).toBeInTheDocument();
  });
});
