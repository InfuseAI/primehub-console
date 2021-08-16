import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen, waitFor } from 'test/test-utils';

import UsageReport from '../UsageReport';
import { UsageReportQuery } from '../usageReport.graphql';

function setup() {
  const mockRequests = [
    {
      request: {
        query: UsageReportQuery,
        variables: {
          usageReportPage: 1,
        },
      },
      result: {
        data: {
          usageReport: {
            edges: [
              {
                cursor: '2021/08',
                node: {
                  id: '2021/08',
                  summaryUrl: 'http://localhost:3001/report/monthly/2021/8',
                  detailedUrl:
                    'http://localhost:3001/report/monthly/details/2021/8',
                  __typename: 'UsageReport',
                },
                __typename: 'UsageReportEdge',
              },
              {
                cursor: '2021/07',
                node: {
                  id: '2021/07',
                  summaryUrl: 'http://localhost:3001/report/monthly/2021/7',
                  detailedUrl:
                    'http://localhost:3001/report/monthly/details/2021/7',
                  __typename: 'UsageReport',
                },
                __typename: 'UsageReportEdge',
              },
              {
                cursor: '2021/06',
                node: {
                  id: '2021/06',
                  summaryUrl: 'http://localhost:3001/report/monthly/2021/6',
                  detailedUrl:
                    'http://localhost:3001/report/monthly/details/2021/6',
                  __typename: 'UsageReport',
                },
                __typename: 'UsageReportEdge',
              },
            ],
            pageInfo: {
              currentPage: 1,
              totalPage: 2,
              __typename: 'PageInfo',
            },
            __typename: 'UsageReportConnection',
          },
        },
      },
    },
  ];

  function TestProvider({ children }: { children: React.ReactNode }) {
    return <MemoryRouter>{children}</MemoryRouter>;
  }

  return {
    mockRequests,
    TestProvider,
  };
}

describe('UsageReport', () => {
  it('should render usage report with error messages', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <UsageReport />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Failure to load usage report data.')
    ).toBeInTheDocument();
  });

  it('should render usage report information', async () => {
    const { mockRequests, TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <UsageReport />
        </MockedProvider>
      </TestProvider>
    );

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeDisabled();

    await waitFor(() => {
      expect(searchInput).not.toBeDisabled();
      expect(screen.getByText('2021/08')).toBeInTheDocument();
    });
  });
});
