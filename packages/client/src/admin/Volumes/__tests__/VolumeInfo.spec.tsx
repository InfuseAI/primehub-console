import * as React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen, waitFor } from 'test/test-utils';

import { VolumeInfo } from '../VolumeInfo';
import { VolumeQuery } from 'queries/Volumes.graphql';
import { IntlProvider } from 'react-intl';

function setup() {
  function TestProvider({ children }: { children: React.ReactNode }) {
    return (
      <IntlProvider locale='en'>
        <MemoryRouter initialEntries={['/admin/volume/volume-test']}>
          <Route path='/admin/volume/:id'>{children}</Route>
        </MemoryRouter>
      </IntlProvider>
    );
  }

  return {
    TestProvider,
  };
}

function makeMockRequest(volume) {
  return [
    {
      request: {
        query: VolumeQuery,
        variables: {
          where: {
            id: 'volume-test',
          },
        },
      },
      result: {
        data: {
          volume: volume,
        },
      },
    },
  ];
}

describe('VolumeInfo', () => {
  it('should render volume with error message', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <VolumeInfo />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Failure to load volumes.')
    ).toBeInTheDocument();
  });

  it('should render volume information', async () => {
    const { TestProvider } = setup();
    const volume = {
      id: 'volume-test',
      name: 'name',
      displayName: 'displayName',
      description: 'description',
      type: 'env',
    };
    const mockRequests = makeMockRequest(volume);

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <VolumeInfo fetchPolicy='no-cache' />
        </MockedProvider>
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('volume'));
      expect(screen.getByTestId('volume/input-name')).toHaveValue(volume.name);
      expect(screen.getByTestId('volume/input-displayName')).toHaveDisplayValue(volume.displayName);
      expect(screen.getByTestId('volume/input-description')).toHaveDisplayValue(volume.description);
    });
  });
});
