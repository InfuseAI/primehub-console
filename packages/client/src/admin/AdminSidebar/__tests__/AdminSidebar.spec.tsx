import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { render, screen } from 'test/test-utils';
import { AdminSidebar } from '../AdminSidebar';

const MOCK_ROUTE_PATHNAME = 'group';

describe('AdminSidebar', () => {
  it('should render AdminSidebar with default items', () => {
    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    expect(screen.getByTestId('group-active')).toBeInTheDocument();
    expect(screen.getByTestId('group-active')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Instance Types')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Image Builder')).toBeInTheDocument();
    expect(screen.getByText('Datasets')).toBeInTheDocument();
    expect(screen.getByText('Secrets')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('should render AdminSidebar with usage reports', () => {
    // @ts-ignore
    global.enableUsageReport = true;

    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Usage Reports')).toBeInTheDocument();
  });

  it('should render AdminSidebar with maintenance', () => {
    // @ts-ignore
    global.enableMaintenanceNotebook = true;

    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('should render AdminSidebar with grafana', () => {
    // @ts-ignore
    global.enableGrafana = true;

    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Grafana')).toBeInTheDocument();
  });

  it('should navigate from group to user page', () => {
    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    const navgiateToUserPage = screen.getByTestId('user');
    userEvent.click(navgiateToUserPage);

    expect(screen.getByTestId('user-active')).toBeInTheDocument();
  });
});
