import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen } from 'test/test-utils';

import { Apps } from '..';

describe('App Settings', () => {
  it('should render app settings with import url', async () => {
    render(
      <MemoryRouter>
        <MockedProvider>
          <Apps />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Import Custom App Template YAML from URL')
    ).toBeInTheDocument();
  });
});
