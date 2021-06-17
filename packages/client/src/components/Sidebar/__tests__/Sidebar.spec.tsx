import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';

import { UserContext } from 'context/user';
import { Sidebar, sidebarList } from 'components/Sidebar';
import { render, screen } from 'test/test-utils';

const MOCK_GROUP_NAME = 'fakeGroup';
const MOCK_ROUTE_PATHNAME = 'home';

function createMockUser({ isCurrentGroupAdmin = false } = {}) {
  return {
    id: '001',
    username: 'test-user',
    isCurrentGroupAdmin,
  };
}

describe('Sidebar Component', () => {
  it('should render home with active status', () => {
    const mockUser = createMockUser();

    // @ts-ignore
    global.enableApp = true;

    render(
      <MemoryRouter
        initialEntries={[`/g/${MOCK_GROUP_NAME}/${MOCK_ROUTE_PATHNAME}`]}
      >
        <Route path={`/g/:groupName/${MOCK_ROUTE_PATHNAME}`}>
          <UserContext.Provider value={mockUser}>
            <Sidebar sidebarItems={sidebarList} />
          </UserContext.Provider>
        </Route>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-active')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Deployments')).toBeInTheDocument();
    expect(screen.getByText('Shared Files')).toBeInTheDocument();
    expect(screen.getByText('Apps')).toBeInTheDocument();
    expect(screen.queryByText('Images')).toBeNull();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('should render images and settings when user is current group admin', () => {
    const mockUser = createMockUser({ isCurrentGroupAdmin: true });

    // @ts-ignore
    global.enableApp = true;

    render(
      <MemoryRouter
        initialEntries={[`/g/${MOCK_GROUP_NAME}/${MOCK_ROUTE_PATHNAME}`]}
      >
        <Route path={`/g/:groupName/${MOCK_ROUTE_PATHNAME}`}>
          <UserContext.Provider value={mockUser}>
            <Sidebar sidebarItems={sidebarList} />
          </UserContext.Provider>
        </Route>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-active')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Deployments')).toBeInTheDocument();
    expect(screen.getByText('Shared Files')).toBeInTheDocument();
    expect(screen.getByText('Apps')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render job with active status when toggling from home', () => {
    const mockUser = createMockUser();

    // @ts-ignore
    global.enableApp = true;

    render(
      <MemoryRouter
        initialEntries={[`/g/${MOCK_GROUP_NAME}/${MOCK_ROUTE_PATHNAME}`]}
      >
        <Route path={`/g/:groupName/${MOCK_ROUTE_PATHNAME}`}>
          <UserContext.Provider value={mockUser}>
            <Sidebar sidebarItems={sidebarList} />
          </UserContext.Provider>
        </Route>
      </MemoryRouter>
    );

    const jobItem = screen.getByTestId('job');
    userEvent.click(jobItem);

    expect(screen.getByTestId('job-active')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Deployments')).toBeInTheDocument();
    expect(screen.getByText('Shared Files')).toBeInTheDocument();
    expect(screen.getByText('Apps')).toBeInTheDocument();
    expect(screen.queryByText('Images')).toBeNull();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('should not render App when item is disabled', () => {
    const mockUser = createMockUser();

    // @ts-ignore
    global.enableApp = false;

    render(
      <MemoryRouter
        initialEntries={[`/g/${MOCK_GROUP_NAME}/${MOCK_ROUTE_PATHNAME}`]}
      >
        <Route path={`/g/:groupName/${MOCK_ROUTE_PATHNAME}`}>
          <UserContext.Provider value={mockUser}>
            <Sidebar sidebarItems={sidebarList} />
          </UserContext.Provider>
        </Route>
      </MemoryRouter>
    );

    expect(screen.queryByText('Apps')).toBeNull();
  });
});
