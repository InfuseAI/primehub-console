import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import ListContainer from 'containers/ListContainer';
import { render, screen, waitFor } from 'test/test-utils';
import { GroupContext, GroupContextValue } from 'context/group';
import { CurrentUser } from 'queries/User.graphql';
import { me as mockMe } from '../../../fakeData/me';

function setup() {
  const mockRequests = [
    {
      request: {
        query: CurrentUser,
      },
      result: {
        data: {
          me: mockMe,
        },
      },
    },
  ];

  const mockGroup: GroupContextValue = {
    id: 'groupId1',
    name: 'group1',
    displayName: 'c-Group 1',
    admins: 'test',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  const MockComponent = ({ groups, groupContext }) => {
    return (
      <div>
        <div>
          Group Name: <span>{groupContext.name}</span>
        </div>
        <div>
          First Group Name: <span>{groups[0].displayName}</span>
        </div>
      </div>
    );
  };

  return {
    mockRequests,
    mockGroup,
    MockComponent,
  };
}

describe('ListContainer', () => {
  it('should render list container with loading status', () => {
    const { mockRequests, mockGroup, MockComponent } = setup();

    render(
      <MockedProvider mocks={mockRequests}>
        <GroupContext.Provider value={mockGroup}>
          <MemoryRouter>
            <ListContainer Com={MockComponent} />
          </MemoryRouter>
        </GroupContext.Provider>
      </MockedProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should render list cotainer with error message', async () => {
    const { mockGroup, MockComponent } = setup();

    render(
      <MockedProvider mocks={[]}>
        <GroupContext.Provider value={mockGroup}>
          <MemoryRouter>
            <ListContainer Com={MockComponent} />
          </MemoryRouter>
        </GroupContext.Provider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('should render list container with custom component', async () => {
    const { mockRequests, mockGroup, MockComponent } = setup();

    render(
      <MockedProvider mocks={mockRequests}>
        <GroupContext.Provider value={mockGroup}>
          <MemoryRouter>
            <ListContainer Com={MockComponent} />
          </MemoryRouter>
        </GroupContext.Provider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(mockGroup.name)).toBeInTheDocument();
      expect(
        screen.getByText(mockMe.groups[0].displayName)
      ).toBeInTheDocument();
    });
  });
});
