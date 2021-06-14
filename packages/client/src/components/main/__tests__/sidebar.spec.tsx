import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';

import { Sidebar } from '../sidebar';
import { render, screen } from 'test/test-utils';
import { sidebarList } from 'utils/sidebarList';

const MOCK_GROUP_NAME = 'fakeGroup';
const MOCK_ROUTE_PATHNAME = 'home';

describe('Sidebar Component', () => {
  it('should render home with active status', () => {
    render(
      <MemoryRouter
        initialEntries={[`/g/${MOCK_GROUP_NAME}/${MOCK_ROUTE_PATHNAME}`]}
      >
        <Route path={`/g/:groupName/${MOCK_ROUTE_PATHNAME}`}>
          <Sidebar sidebarItems={sidebarList} />
        </Route>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-active')).toBeInTheDocument();
  });

  it('should render job with active status when toggling from home', () => {
    render(
      <MemoryRouter
        initialEntries={[`/g/${MOCK_GROUP_NAME}/${MOCK_ROUTE_PATHNAME}`]}
      >
        <Route path={`/g/:groupName/${MOCK_ROUTE_PATHNAME}`}>
          <Sidebar sidebarItems={sidebarList} />
        </Route>
      </MemoryRouter>
    );

    const jobItem = screen.getByTestId('job');
    userEvent.click(jobItem);

    expect(screen.getByTestId('job-active')).toBeInTheDocument();
  });
});
