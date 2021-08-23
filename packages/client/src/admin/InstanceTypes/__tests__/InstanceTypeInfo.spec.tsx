import * as React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen, waitFor } from 'test/test-utils';

import { InstanceTypeInfo } from '../InstanceTypeInfo';
import { InstanceTypeInfoQuery } from '../instanceTypes.graphql';

function setup() {
  const mockRequests = [
    {
      request: {
        query: InstanceTypeInfoQuery,
        variables: {
          where: {
            id: 'cpu-1',
          },
        },
      },
      result: {
        data: {
          instanceType: {
            id: 'cpu-1',
            description: '',
            cpuRequest: 0.5,
            memoryRequest: 1,
            global: false,
            groups: [],
            tolerations: [
              {
                key: 'test1',
                value: null,
                operator: 'Exists',
                effect: 'None',
                __typename: 'Toleration',
              },
              {
                key: 'test2',
                value: null,
                operator: 'Exists',
                effect: 'None',
                __typename: 'Toleration',
              },
              {
                key: 'test3',
                value: null,
                operator: 'Exists',
                effect: 'None',
                __typename: 'Toleration',
              },
            ],
            nodeSelector: {
              aaa: 'aaa',
            },
            name: 'cpu-1',
            displayName: 'cpu-1',
            cpuLimit: 1.5,
            memoryLimit: 2,
            gpuLimit: 0,
            __typename: 'InstanceType',
          },
        },
      },
    },
  ];

  function TestProvider({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={['/admin/instanceType/cpu-1']}>
        <Route path='/admin/instanceType/:id'>{children}</Route>
      </MemoryRouter>
    );
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

describe('InstanceTypeInfo', () => {
  it('should render instance type information with error messages', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <InstanceTypeInfo />
        </MockedProvider>
      </TestProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failure to fetch data, try again later.')
      ).toBeInTheDocument();
    });
  });

  it('should render instance type information with fetched data', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <InstanceTypeInfo />
        </MockedProvider>
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveDisplayValue('cpu-1');
      expect(screen.getByLabelText('Display Name')).toHaveDisplayValue('cpu-1');
      expect(screen.getByLabelText('Description')).toHaveDisplayValue('');
      expect(screen.getByTestId('CPU Limit')).toHaveDisplayValue('1.5');
      expect(screen.getByTestId('Memory Limit')).toHaveDisplayValue('2.0 GB');
      expect(screen.getByTestId('GPU Limit')).toHaveDisplayValue('0');
      expect(screen.getByTestId('enabled-memoryRequest')).not.toBeChecked();
      expect(screen.getByTestId('enabled-cpuRequest')).not.toBeChecked();
      expect(screen.getByTestId('Global')).not.toBeChecked();
    });
  });
});
