import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { render, screen } from 'test/test-utils';
import { AppCard } from '../AppCard';

function setup() {
  const mockTemplate = {
    id: '123',
    icon: 'https://via.placeholder.com/64',
    version: '1.0',
    docLink: 'https://infuseai.io',
    description: 'A little app',
    text: 'Hi, there',
    tag: 'MLOps',
  };

  return {
    mockTemplate,
  };
}

describe('AppCard', () => {
  it('should render app card with template information', () => {
    const { mockTemplate } = setup();
    const noop = () => ({});

    render(<AppCard template={mockTemplate} onInstall={noop} />);

    expect(screen.getByText('A little app')).toBeInTheDocument();
    expect(screen.getByText('MLOps')).toBeInTheDocument();
    expect(screen.getByText('Install to PrimeHub')).toBeInTheDocument();
  });

  it('should render app card and call install to primehub action', () => {
    const { mockTemplate } = setup();
    const mockInstall = jest.fn();

    render(<AppCard template={mockTemplate} onInstall={() => mockInstall()} />);

    const installButton = screen.getByText('Install to PrimeHub');
    userEvent.click(installButton);

    expect(mockInstall).toBeCalled();
  });

  it('should not render install button when installable is false', () => {
    const { mockTemplate } = setup();

    render(<AppCard template={mockTemplate} installable={false} />);

    expect(screen.queryByText('Install to PrimeHub')).not.toBeInTheDocument();
  });
});
