import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen, waitFor } from 'test/test-utils';

import { SecretInfo } from '../SecretInfo';
import { SecretQuery } from '../secrets.graphql';

function setup() {
  const mockRequests = [
    {
      request: {
        query: SecretQuery,
        variables: {
          where: {
            id: 'gitsync-secret-csr-foobar',
          },
        },
      },
      result: {
        data: {
          secret: {
            id: 'gitsync-secret-csr-foobar',
            registryHost: null,
            username: null,
            password: null,
            name: 'csr-foobar',
            displayName: 'csr-foobarrr',
            type: 'opaque',
            __typename: 'Secret',
          },
        },
      },
    },
  ];

  function TestProvider({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter
        initialEntries={['/admin/secret/gitsync-secret-csr-foobar']}
      >
        <Route path="/admin/secret/:id">{children}</Route>
      </MemoryRouter>
    );
  }

  return {
    TestProvider,
    mockRequests,
  };
}

describe('SecretInfo', () => {
  it('should render secret with error message', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <SecretInfo />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Failure to load secrets.')
    ).toBeInTheDocument();
  });

  it('should render secret information', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <SecretInfo />
        </MockedProvider>
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveDisplayValue('csr-foobar');
      expect(screen.getByLabelText('Display Name')).toHaveDisplayValue(
        'csr-foobarrr'
      );
      expect(screen.getByTestId('secret-type')).toHaveTextContent(
        'Git Volume'
      );
    });
  });

});
