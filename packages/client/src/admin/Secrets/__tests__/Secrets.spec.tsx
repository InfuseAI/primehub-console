import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen } from 'test/test-utils';

import { Secrets } from '../Secrets';
import { GetSecrets } from '../secrets.graphql';

function setup() {
  const mockRequests = [
    {
      request: {
        query: GetSecrets,
      },
      result: {
        data: {
          secretsConnection: {
            edges: [
              {
                cursor: 'gitsync-secret-csr-foobar',
                node: {
                  id: 'gitsync-secret-csr-foobar',
                  name: 'csr-foobar',
                  displayName: 'csr-foobarrr',
                  type: 'opaque',
                  registryHost: null,
                  username: null,
                  password: null,
                  __typename: 'Secret',
                },
                __typename: 'SecretEdge',
              },
              {
                cursor: 'gitsync-secret-csr-foobar2',
                node: {
                  id: 'gitsync-secret-csr-foobar2',
                  name: 'csr-foobar2',
                  displayName: 'csr-foobarrr2',
                  type: 'opaque',
                  registryHost: null,
                  username: null,
                  password: null,
                  __typename: 'Secret',
                },
                __typename: 'SecretEdge',
              },
              {
                cursor: 'gitsync-secret-csr-foobar3',
                node: {
                  id: 'gitsync-secret-csr-foobar3',
                  name: 'csr-foobar3',
                  displayName: 'csr-foobarrr3',
                  type: 'opaque',
                  registryHost: null,
                  username: null,
                  password: null,
                  __typename: 'Secret',
                },
                __typename: 'SecretEdge',
              },
            ],
            __typename: 'SecretConnection',
          },
        },
      },
    },
  ];

  function TestProvider({ children }: { children: React.ReactNode }) {
    return <MemoryRouter>{children}</MemoryRouter>;
  }

  return {
    TestProvider,
    mockRequests,
  };
}

describe('Secrets', () => {
  it('should render secrts with error messages', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <Secrets />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Failure to load secrets.')
    ).toBeInTheDocument();
  });

  it('should render secrts with fetched data', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <Secrets />
        </MockedProvider>
      </TestProvider>
    );

    expect(await screen.findByText('csr-foobar')).toBeInTheDocument();
    expect(await screen.findByText('csr-foobar2')).toBeInTheDocument();
    expect(await screen.findByText('csr-foobar3')).toBeInTheDocument();
  });

  it('should render secrent and toggle to create a secret form', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <Secrets />
        </MockedProvider>
      </TestProvider>
    );

    const addSecretButton = await screen.findByText('Add');
    userEvent.click(addSecretButton);

    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});
