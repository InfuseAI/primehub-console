import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen, waitFor } from 'test/test-utils';

import { DatasetInfo } from '../DatasetInfo';
import { DatasetQuery } from 'queries/datasets.graphql';
import { IntlProvider } from 'react-intl';

function setup() {
  function TestProvider({ children }: { children: React.ReactNode }) {
    return (
      <IntlProvider locale='en'>
        <MemoryRouter initialEntries={['/admin/dataset/dataset-test']}>
          <Route path='/admin/dataset/:id'>{children}</Route>
        </MemoryRouter>
      </IntlProvider>
    );
  }

  return {
    TestProvider,
  };
}

function makeMockRequest(dataset) {
  return [
    {
      request: {
        query: DatasetQuery,
        variables: {
          where: {
            id: 'dataset-test',
          },
        },
      },
      result: {
        data: {
          dataset,
        },
      },
    },
  ];
}

describe('DatasetInfo', () => {
  it('should render dataset with error message', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <DatasetInfo />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Failure to load datasets.')
    ).toBeInTheDocument();
  });

  it('should render dataset information', async () => {
    const { TestProvider } = setup();
    const dataset = {
      id: 'dataset-test',
      name: 'name',
      displayName: 'displayName',
      description: 'description',
      type: 'env',
    };
    const mockRequests = makeMockRequest(dataset);

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <DatasetInfo />
        </MockedProvider>
      </TestProvider>
    );

    screen.debug();
    await waitFor(() => {
      expect(screen.getByTestId('dataset'));
      expect(screen.getByTestId('dataset/input-name')).toHaveValue(dataset.name);
      expect(screen.getByTestId('dataset/input-displayName')).toHaveDisplayValue(dataset.displayName);
      expect(screen.getByTestId('dataset/input-description')).toHaveDisplayValue(dataset.description);
    });
  });
});
