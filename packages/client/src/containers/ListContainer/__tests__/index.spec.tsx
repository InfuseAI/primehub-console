import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { ListContainer } from 'containers/ListContainer';
import { render, screen } from 'test/test-utils';
import type { GroupContextValue } from 'context/group';

import { groups as mockGroups } from '../../../fakeData/groups';

function setup() {
  const groupContextValue: GroupContextValue = {
    id: 'test-group',
    name: 'test-group',
    displayName: 'test-group',
    admins: 'test',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  const mockRouteProps: any = {
    location: {},
    pathname: {},
    history: {},
    match: {},
  };

  const user = {
    loading: false,
    error: null,
    me: {
      groups: mockGroups,
    },
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
    user,
    groupContextValue,
    mockRouteProps,
    MockComponent,
  };
}

describe('ListContainer', () => {
  it('should render list container', () => {
    const { user, groupContextValue, mockRouteProps, MockComponent } = setup();

    render(
      <MemoryRouter>
        <ListContainer
          {...mockRouteProps}
          currentUser={user}
          groupContext={groupContextValue}
          render={({ groups, groupContext }) => (
            <MockComponent groups={groups} groupContext={groupContext} />
          )}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(groupContextValue.name)).toBeInTheDocument();
    expect(screen.getByText(mockGroups[0].displayName)).toBeInTheDocument();
  });

  it('should render null when data is fetching', () => {
    const { user, groupContextValue, mockRouteProps, MockComponent } = setup();

    render(
      <MemoryRouter>
        <ListContainer
          {...mockRouteProps}
          currentUser={{ ...user, loading: true }}
          groupContext={groupContextValue}
          render={({ groups, groupContext }) => (
            <MockComponent groups={groups} groupContext={groupContext} />
          )}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(groupContextValue.name)).toBeNull();
    expect(screen.queryByText(mockGroups[0].displayName)).toBeNull();
  });

  it('should render error message when fetching data failure', () => {
    const { user, groupContextValue, mockRouteProps, MockComponent } = setup();

    render(
      <MemoryRouter>
        <ListContainer
          {...mockRouteProps}
          currentUser={{ ...user, error: 'Error' }}
          groupContext={groupContextValue}
          render={({ groups, groupContext }) => (
            <MockComponent groups={groups} groupContext={groupContext} />
          )}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText(groupContextValue.name)).toBeNull();
    expect(screen.queryByText(mockGroups[0].displayName)).toBeNull();
  });
});
