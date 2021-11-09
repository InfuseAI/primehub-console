import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';

import { UserContext } from 'context/user';
import { Sidebar, listCE, listEE } from 'components/Sidebar';
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
            <Sidebar sidebarItems={listEE} />
          </UserContext.Provider>
        </Route>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-active')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
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
            <Sidebar sidebarItems={listEE} />
          </UserContext.Provider>
        </Route>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-active')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
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
            <Sidebar sidebarItems={listEE} />
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
            <Sidebar sidebarItems={listEE} />
          </UserContext.Provider>
        </Route>
      </MemoryRouter>
    );

    expect(screen.queryByText('Apps')).toBeNull();
  });

  it('should render pro feature badge and item in ce list', () => {
    const mockUser = createMockUser({ isCurrentGroupAdmin: true });

    // @ts-ignore
    global.enableApp = true;

    render(
      <MemoryRouter
        initialEntries={[`/g/${MOCK_GROUP_NAME}/${MOCK_ROUTE_PATHNAME}`]}
      >
        <Route path={`/g/:groupName/${MOCK_ROUTE_PATHNAME}`}>
          <UserContext.Provider value={mockUser}>
            <Sidebar sidebarItems={listCE} />
          </UserContext.Provider>
        </Route>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-active')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Jobs').nextElementSibling.textContent).toBe('pro');
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Models').nextElementSibling.textContent).toBe(
      'pro'
    );
    expect(screen.getByText('Deployments')).toBeInTheDocument();
    expect(screen.getByText('Deployments').nextElementSibling.textContent).toBe(
      'pro'
    );
    expect(screen.getByText('Shared Files')).toBeInTheDocument();
    expect(screen.getByText('Apps')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render upgrade dialog if click pro feature menu in ce list', () => {
    const mockUser = createMockUser();

    // @ts-ignore
    global.enableApp = true;

    render(
      <MemoryRouter
        initialEntries={[`/g/${MOCK_GROUP_NAME}/${MOCK_ROUTE_PATHNAME}`]}
      >
        <Route path={`/g/:groupName/${MOCK_ROUTE_PATHNAME}`}>
          <UserContext.Provider value={mockUser}>
            <Sidebar sidebarItems={listCE} />
          </UserContext.Provider>
        </Route>
      </MemoryRouter>
    );

    const jobItem = screen.getByTestId('job');
    userEvent.click(jobItem);

    expect(
      screen.getByText('Upgrade to Enterprise Edition')
    ).toBeInTheDocument();
  });
});
