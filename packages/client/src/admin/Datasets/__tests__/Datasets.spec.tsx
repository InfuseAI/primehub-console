import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen } from 'test/test-utils';

import { Datasets } from '../Datasets';
import { GetDatasets } from 'queries/datasets.graphql';
import { IntlProvider } from 'react-intl';

function setup() {
  const mockRequests = [
    {
      request: {
        query: GetDatasets,
        variables: {
          page: 1,
          orderBy: {},
          where: {},
        },
      },
      result: {
        data: {
          datasetsConnection: {
            edges: [
              {
                cursor: 'env',
                node: {
                  id: 'dataset-env',
                  name: 'dataset-env',
                  displayName: 'xxx',
                  description: 'env',
                  type: 'env',
                  uploadServerLink: null,
                  __typename: 'Dataset',
                },
                __typename: 'DatasetEdge',
              },
              {
                cursor: 'git',
                node: {
                  id: 'dataset-git',
                  name: 'dataset-git',
                  displayName: 'gitsync dataset',
                  description: '',
                  type: 'git',
                  uploadServerLink: null,
                  __typename: 'Dataset',
                },
                __typename: 'DatasetEdge',
              },
              {
                cursor: 'hostpath',
                node: {
                  id: 'dataset-hostpath',
                  name: 'dataset-hostpath',
                  displayName: 'hostpath-ooxx',
                  description: '',
                  type: 'hostPath',
                  uploadServerLink: null,
                  __typename: 'Dataset',
                },
                __typename: 'DatasetEdge',
              },
              {
                cursor: 'nfs',
                node: {
                  id: 'dataset-nfs',
                  name: 'dataset-nfs',
                  displayName: 'nfs',
                  description: '',
                  type: 'nfs',
                  uploadServerLink: null,
                  __typename: 'Dataset',
                },
                __typename: 'DatasetEdge',
              },
              {
                cursor: 'pv-auto',
                node: {
                  id: 'dataset-pv-auto',
                  name: 'dataset-pv-auto',
                  displayName: 'auto',
                  description: 'auto',
                  type: 'pv',
                  uploadServerLink: null,
                  __typename: 'Dataset',
                },
                __typename: 'DatasetEdge',
              },
              {
                cursor: 'pv-manual',
                node: {
                  id: 'dataset-pv-manual',
                  name: 'dataset-pv-manual',
                  displayName: 'pv manual',
                  description: 'PV Manual Provision',
                  type: 'pv',
                  uploadServerLink: null,
                  __typename: 'Dataset',
                },
                __typename: 'DatasetEdge',
              },
            ],
            pageInfo: {
              currentPage: 1,
              totalPage: 1,
              __typename: 'PageInfo',
            },
            __typename: 'DatasetConnection',
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

describe('Datasets', () => {
  it('should render datasets with error messages', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <Datasets />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Failure to load datasets.')
    ).toBeInTheDocument();
  });

  it('should render datasets with fetched data', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <Datasets />
        </MockedProvider>
      </TestProvider>
    );

    expect(await screen.findByText('dataset-env')).toBeInTheDocument();
    expect(await screen.findByText('dataset-git')).toBeInTheDocument();
    expect(await screen.findByText('dataset-nfs')).toBeInTheDocument();
    expect(await screen.findByText('dataset-hostpath')).toBeInTheDocument();
    expect(await screen.findByText('dataset-pv-auto')).toBeInTheDocument();
    expect(await screen.findByText('dataset-pv-manual')).toBeInTheDocument();
  });

  it('should render dataset and add a dataset form', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <Datasets />
        </MockedProvider>
      </TestProvider>
    );

    const addButton = await screen.findByTestId('add-button');
    userEvent.click(addButton);

    expect(await screen.findByTestId('confirm-button')).toBeInTheDocument();
  });
});
