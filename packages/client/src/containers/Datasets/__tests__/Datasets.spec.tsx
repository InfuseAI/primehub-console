import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { DatasetList } from '..';
import { GroupContextValue, GroupContext } from 'context/group';
import { render, screen } from 'test/test-utils';

import { GetDatasets } from '../dataset.graphql';
import { groups as mockGroups } from '../../../fakeData/groups';

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
            edges: [
              {
                node: {
                  id: 'a1-ml3qa',
                  name: 'a1',
                  createdBy: 'phadmin',
                  createdAt: '2021-11-08T10:38:45.006Z',
                  updatedAt: '2021-11-08T10:38:45.006Z',
                  tags: ['fdaf', 'fsdaf'],
                  size: 0,
                },
                cursor: 'a1-ml3qa',
              },
              {
                node: {
                  id: 'a2-9malk',
                  name: 'a2',
                  createdBy: 'phadmin',
                  createdAt: '2021-11-08T10:39:32.855Z',
                  updatedAt: '2021-11-08T10:39:32.855Z',
                  tags: [],
                  size: 0,
                },
                cursor: 'a2-9malk',
              },
              {
                node: {
                  id: 'a4-kswvd',
                  name: 'a4',
                  createdBy: 'phadmin',
                  createdAt: '2021-11-08T10:42:46.237Z',
                  updatedAt: '2021-11-08T10:42:46.238Z',
                  tags: ['fdsaf'],
                  size: 0,
                },
                cursor: 'a4-kswvd',
              },
              {
                node: {
                  id: 'd0',
                  name: 'd0hahaha',
                  createdBy: 'qq',
                  createdAt: '2021-11-02T08:52:48.369Z',
                  updatedAt: '2021-11-10T04:09:19.497Z',
                  tags: ['foo', 'bar', 'qq'],
                  size: 500000,
                },
                cursor: 'd0',
              },
              {
                node: {
                  id: 'd1',
                  name: 'Dataset One',
                  createdBy: 'qq',
                  createdAt: '2021-11-02T08:52:48.369Z',
                  updatedAt: '2021-11-02T08:52:48.369Z',
                  tags: ['foo', 'bar'],
                  size: 5000,
                },
                cursor: 'd1',
              },
              {
                node: {
                  id: 'd2',
                  name: 'Dataset Two',
                  createdBy: 'qq',
                  createdAt: '2021-11-02T08:52:48.369Z',
                  updatedAt: '2021-11-02T08:52:48.369Z',
                  tags: ['foo', 'bar'],
                  size: 50000000,
                },
                cursor: 'd2',
              },
              {
                node: {
                  id: 'd3',
                  name: 'Dataset Three',
                  createdBy: 'qq',
                  createdAt: '2021-11-02T08:52:48.369Z',
                  updatedAt: '2021-11-02T08:52:48.369Z',
                  tags: ['foo', 'bar'],
                  size: 5000000000000,
                },
                cursor: 'd3',
              },
              {
                node: {
                  id: 'da3',
                  name: 'da3',
                  createdBy: 'qq',
                  createdAt: '2021-11-02T08:52:48.369Z',
                  updatedAt: '2021-11-02T08:52:48.369Z',
                  tags: ['foo', 'bar'],
                  size: 5000000000,
                },
                cursor: 'd13',
              },
              {
                node: {
                  id: 'da4',
                  name: 'da4',
                  createdBy: 'qq',
                  createdAt: '2021-11-02T08:52:48.369Z',
                  updatedAt: '2021-11-02T08:52:48.369Z',
                  tags: ['foo', 'bar'],
                  size: 50000000,
                },
                cursor: 'da4',
              },
              {
                node: {
                  id: 'da5',
                  name: 'da5',
                  createdBy: 'qq',
                  createdAt: '2021-11-02T08:52:48.369Z',
                  updatedAt: '2021-11-02T08:52:48.369Z',
                  tags: ['foo', 'bar'],
                  size: 5000000,
                },
                cursor: 'da5',
              },
            ],
            pageInfo: {
              currentPage: 1,
              totalPage: 4,
            },
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

describe('Datasets V2', () => {
  it('should render did not authorized group message', async () => {
    const { mockGroupContext, mockRequests } = setup();
    const withFakeGroup = {
      ...mockGroupContext,
      id: 'fake-group',
    };

    render(
      <MemoryRouter>
        <MockedProvider addTypename={false} mocks={mockRequests}>
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
        <MockedProvider addTypename={false} mocks={mockRequests}>
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
