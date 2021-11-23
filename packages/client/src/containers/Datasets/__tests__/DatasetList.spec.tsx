import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { DatasetList } from '..';
import { GroupContextValue, GroupContext } from 'context/group';
import { fireEvent, render, screen, waitFor } from 'test/test-utils';

import { GetDatasets, CreateDatasetMutation } from '../dataset.graphql';
import { groups as mockGroups } from '../../../fakeData/groups';
import { datasetsV2 } from '../../../fakeData/datasetsV2';
import userEvent from '@testing-library/user-event';

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
    {
      request: {
        query: CreateDatasetMutation,
        variables: {
          payload: {
            id: 'dataset-new',
            tags: [],
            groupName: mockGroupContext.name,
          },
        },
      },
      result: {
        data: {
          createDatasetV2: {
            id: 'dataset-new',
            name: 'dataset-new',
            createdBy: 'phadmin',
            createdAt: '2021-11-19T08:49:14.763Z',
            updatedAt: '2021-11-19T08:49:14.763Z',
            tags: [],
            size: 0,
            __typename: 'DatasetV2',
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
  it('should render datasets with error message', async () => {
    const { mockGroupContext } = setup();
    window.enablePhfs = true;

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
    window.enablePhfs = true;

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
    screen.debug();
  });
});

describe('Create Dataset V2', () => {
  it('should create new dataset', async () => {
    const { mockGroupContext, mockRequests } = setup();
    // @ts-ignore
    window.graphqlEndpoint = 'http://download.primehub.io/graphql';
    window.enablePhfs = true;

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <GroupContext.Provider value={mockGroupContext}>
            <DatasetList groups={mockGroups} />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    const addButton = await screen.findByTestId('add-button');
    expect(addButton).toBeInTheDocument();

    userEvent.click(addButton);
    const createButton = await screen.findByTestId('create-dataset-button');
    expect(createButton).toBeInTheDocument();
    expect(createButton).toBeDisabled();

    const inputName = await screen.findByTestId('dataset-name');
    fireEvent.change(inputName, { target: { value: 'dataset-new' } });

    expect(createButton).not.toBeDisabled();
    // screen.debug();
    userEvent.click(createButton);

    await waitFor(() => {
      const doneButton = screen.getByTestId('upload-done-button');
      expect(doneButton).toBeInTheDocument();
    });
  });
});
