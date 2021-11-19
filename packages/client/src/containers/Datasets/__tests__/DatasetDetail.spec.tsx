import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { DatasetDetail } from '..';
import { GroupContextValue, GroupContext } from 'context/group';
import { render, screen, fireEvent } from 'test/test-utils';

import { DatasetQuery } from '../dataset.graphql';
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

  const id = 'dataset-one-040t9';
  const mockRouteProps = {
    match: {
      params: {
        datasetId: id,
      },
    },
  };

  const dataset = datasetsV2.find(d => d.id === id);
  const mockRequests = [
    {
      request: {
        query: DatasetQuery,
        variables: {
          where: {
            groupName: mockGroupContext.name,
            id,
          },
        },
      },
      result: {
        data: {
          datasetV2: dataset,
        },
      },
    },
  ];

  return {
    mockGroupContext,
    mockRouteProps,
    mockRequests,
  };
}

describe('Datasets V2 Detail', () => {
  it('should render dataset detail', async () => {
    const { mockGroupContext, mockRouteProps, mockRequests } = setup();
    window.enablePhfs = true;

    render(
      <MemoryRouter>
        <MockedProvider mocks={mockRequests}>
          <GroupContext.Provider value={mockGroupContext}>
            <DatasetDetail {...mockRouteProps} />
          </GroupContext.Provider>
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('Upload Files')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Information'));

    expect(await screen.findByText('Dataset Name')).toBeInTheDocument();
    expect(await screen.findByText('foo')).toBeInTheDocument();
    expect(await screen.findByText('bar')).toBeInTheDocument();
    expect(await screen.findByText('one')).toBeInTheDocument();
    expect(await screen.findByText('phadmin')).toBeInTheDocument();
  });
});

