import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen } from 'test/test-utils';

import { InstanceTypes } from '../InstanceTypes';
import { InstanceTypesQuery } from '../instanceTypes.graphql';

function setup() {
  const mockRequests = [
    {
      request: {
        query: InstanceTypesQuery,
        variables: {
          page: 1,
        },
      },
      result: {
        data: {
          instanceTypesConnection: {
            edges: [
              {
                cursor: 'cpu-1',
                node: {
                  id: 'cpu-1',
                  name: 'cpu-1',
                  displayName: 'cpu one',
                  description: '',
                  cpuLimit: 1.5,
                  memoryLimit: 2,
                  gpuLimit: 0,
                  gpuResourceName: 'nvidia.com/gpu',
                  __typename: 'InstanceType',
                },
                __typename: 'InstanceTypeEdge',
              },
              {
                cursor: 'cpu-2',
                node: {
                  id: 'cpu-2',
                  name: 'cpu-2',
                  displayName: 'cpu two',
                  description: '',
                  cpuLimit: 2,
                  memoryLimit: 1,
                  gpuLimit: 0,
                  gpuResourceName: 'nvidia.com/gpu',
                  __typename: 'InstanceType',
                },
                __typename: 'InstanceTypeEdge',
              },
            ],
            pageInfo: {
              currentPage: 1,
              totalPage: 1,
              __typename: 'PageInfo',
            },
            __typename: 'InstanceTypeConnection',
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

beforeEach(() => {
  // @ts-ignore
  global.modelDeploymentOnly = false;
});

describe('Secrets', () => {
  it('should render instance type with error messages', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <InstanceTypes />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Failure to load instances.')
    ).toBeInTheDocument();
  });

  it('should render instance type with fetched data', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <InstanceTypes />
        </MockedProvider>
      </TestProvider>
    );

    expect(await screen.findByText('cpu one')).toBeInTheDocument();
    expect(await screen.findByText('cpu two')).toBeInTheDocument();
  });

  it('should render instance type and toggle to create instance form', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <InstanceTypes />
        </MockedProvider>
      </TestProvider>
    );

    const addSecretButton = await screen.findByText('Add');
    userEvent.click(addSecretButton);

    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Tolerations')).toBeInTheDocument();
    expect(screen.getByText('Node Selector')).toBeInTheDocument();
  });
});
