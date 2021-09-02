import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from 'test/test-utils';
import { AdminSidebar } from '../AdminSidebar';

const MOCK_ROUTE_PATHNAME = 'group';

// @ts-ignore
global.modelDeploymentOnly = false;

describe('AdminSidebar', () => {
  it('should render AdminSidebar with default items', () => {
    // @ts-ignore
    global.__ENV__ = 'ee';

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
    global.__ENV__ = 'ee';
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
    global.__ENV__ = 'ee';
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
    global.__ENV__ = 'ee';
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
    // @ts-ignore
    global.__ENV__ = 'ee';

    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    const navgiateToUserPage = screen.getByTestId('user');
    userEvent.click(navgiateToUserPage);

    expect(screen.getByTestId('user-active')).toBeInTheDocument();
  });

  it('should not render image builder when version is CE', async () => {
    // @ts-ignore
    global.__ENV__ = 'ce';

    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    expect(screen.queryByText('Image Builder')).not.toBeInTheDocument();
  });

  it('should render usage reports with pro badge when version is CE', async () => {
    // @ts-ignore
    global.__ENV__ = 'ce';

    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    expect(screen.queryByText('Usage Reports')).toBeInTheDocument();
    expect(
      screen.queryByText('Usage Reports').querySelector('span').textContent
    ).toBe('pro');
  });

  it('should render upgrade dialog if click pro feature menu in ce list', () => {
    // @ts-ignore
    global.__ENV__ = 'ce';

    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    const usageReportItem = screen.queryByText('Usage Reports');
    userEvent.click(usageReportItem);
    expect(
      screen.getByText('Upgrade to Enterprise Edition')
    ).toBeInTheDocument();
  });

  it('should not render dataset, image, image builder and notebook when version is Deployment', async () => {
    // @ts-ignore
    global.__ENV__ = 'modelDeploy';

    render(
      <MemoryRouter initialEntries={[`/admin/${MOCK_ROUTE_PATHNAME}`]}>
        <AdminSidebar />
      </MemoryRouter>
    );

    expect(screen.queryByText('Image')).not.toBeInTheDocument();
    expect(screen.queryByText('Image Builder')).not.toBeInTheDocument();
    expect(screen.queryByText('Datasets')).not.toBeInTheDocument();
    expect(screen.queryByText('Notebooks Admin')).not.toBeInTheDocument();
  });
});
