import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { JupyterHubContainer } from 'containers/jupyterHubPage';
import { render, screen } from 'test/test-utils';
import type { GroupContextValue } from 'context/group';

function setup() {
  const groupValue: GroupContextValue = {
    id: 'test-group',
    name: 'test-group',
    displayName: 'test-group',
    admins: 'test',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  const mockRouteProps = {
    history: {
      location: {
        pathname: '/g/test-group/hub',
      },
    } as any,
    location: {} as any,
    match: {
      params: {
        groupName: 'test-group',
      },
    } as any,
  };

  return { groupValue, mockRouteProps };
}

describe('JupyterHubContainer', () => {
  it('should render jupyter hub container', () => {
    const { groupValue, mockRouteProps } = setup();

    render(
      <MemoryRouter>
        <JupyterHubContainer {...mockRouteProps} groupContext={groupValue} />
      </MemoryRouter>
    );

    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    expect(screen.getByTestId('iframe-component')).toBeInTheDocument();
  });
});
