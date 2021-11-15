import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen } from 'test/test-utils';

import { Volumes } from '../Volumes';
import { GetVolumes } from 'queries/Volumes.graphql';
import { IntlProvider } from 'react-intl';

function setup() {
  const mockRequests = [
    {
      request: {
        query: GetVolumes,
        variables: {
          page: 1,
          orderBy: {},
          where: {},
        },
      },
      result: {
        data: {
          volumesConnection: {
            edges: [
              {
                cursor: 'env',
                node: {
                  id: 'volume-env',
                  name: 'volume-env',
                  displayName: 'xxx',
                  description: 'env',
                  type: 'env',
                  uploadServerLink: null,
                  __typename: 'Volume',
                },
                __typename: 'VolumeEdge',
              },
              {
                cursor: 'git',
                node: {
                  id: 'volume-git',
                  name: 'volume-git',
                  displayName: 'gitsync volume',
                  description: '',
                  type: 'gitSync',
                  uploadServerLink: null,
                  __typename: 'Volume',
                },
                __typename: 'VolumeEdge',
              },
              {
                cursor: 'hostpath',
                node: {
                  id: 'volume-hostpath',
                  name: 'volume-hostpath',
                  displayName: 'hostpath-ooxx',
                  description: '',
                  type: 'hostPath',
                  uploadServerLink: null,
                  __typename: 'Volume',
                },
                __typename: 'VolumeEdge',
              },
              {
                cursor: 'nfs',
                node: {
                  id: 'volume-nfs',
                  name: 'volume-nfs',
                  displayName: 'nfs',
                  description: '',
                  type: 'nfs',
                  uploadServerLink: null,
                  __typename: 'Volume',
                },
                __typename: 'VolumeEdge',
              },
              {
                cursor: 'pv-auto',
                node: {
                  id: 'volume-pv-auto',
                  name: 'volume-pv-auto',
                  displayName: 'auto',
                  description: 'auto',
                  type: 'pv',
                  uploadServerLink: null,
                  __typename: 'Volume',
                },
                __typename: 'VolumeEdge',
              },
              {
                cursor: 'pv-manual',
                node: {
                  id: 'volume-pv-manual',
                  name: 'volume-pv-manual',
                  displayName: 'pv manual',
                  description: 'PV Manual Provision',
                  type: 'pv',
                  uploadServerLink: null,
                  __typename: 'Volume',
                },
                __typename: 'VolumeEdge',
              },
            ],
            pageInfo: {
              currentPage: 1,
              totalPage: 1,
              __typename: 'PageInfo',
            },
            __typename: 'VolumeConnection',
          },
        },
      },
    },
  ];

  function TestProvider({ children }: { children: React.ReactNode }) {
    return (
      <IntlProvider locale='en'>
        <MemoryRouter>{children}</MemoryRouter>
      </IntlProvider>
    );
  }

  return {
    TestProvider,
    mockRequests,
  };
}

describe('Volumes', () => {
  it('should render volumes with error messages', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <Volumes />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Failure to load volumes.')
    ).toBeInTheDocument();
  });

  it('should render volumes with fetched data', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <Volumes />
        </MockedProvider>
      </TestProvider>
    );

    expect(await screen.findByText('volume-env')).toBeInTheDocument();
    expect(await screen.findByText('volume-git')).toBeInTheDocument();
    expect(await screen.findByText('volume-nfs')).toBeInTheDocument();
    expect(await screen.findByText('volume-hostpath')).toBeInTheDocument();
    expect(await screen.findByText('volume-pv-auto')).toBeInTheDocument();
    expect(await screen.findByText('volume-pv-manual')).toBeInTheDocument();
  });

  it('should render volume and add a volume form', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <Volumes />
        </MockedProvider>
      </TestProvider>
    );

    const addButton = await screen.findByTestId('add-button');
    userEvent.click(addButton);

    expect(await screen.findByTestId('confirm-button')).toBeInTheDocument();
  });
});
