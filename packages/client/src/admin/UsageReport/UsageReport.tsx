import * as React from 'react';
import moment from 'moment';
import { Button, Table, Input, Tooltip, Icon } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import Breadcrumbs from 'components/share/breadcrumb';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { UsageReportQuery } from './usageReport.graphql';

function useReportDownload() {
  const [loading, setLoading] = React.useState(false);
  const [token] = useLocalStorage('primehub.accessToken', []);

  const downloadReport = React.useCallback(
    ({ URL, fileName }: { URL: string; fileName: string }) => {
      setLoading(true);
      fetch(URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => {
          setLoading(false);
          return res.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement('a');

          link.href = url;
          link.setAttribute('download', fileName);

          document.body.appendChild(link);

          link.click();
          link.parentNode.removeChild(link);
          window.URL.revokeObjectURL(url);
        });
    },
    [token]
  );

  return [loading, downloadReport] as const;
}

interface TUsageReport {
  id: string;
  summaryUrl: string;
  detailedUrl: string;
}

interface UsageReportNode {
  cursor: string;
  node: TUsageReport;
}

interface QueryVariables {
  usageReportPage: number;
  usageReportWhere?: {
    id_contains: string;
  };
}

interface Props {
  usageReportQuery: {
    error: Error | undefined;
    loading: boolean;
    refetch: (variables: QueryVariables) => void;
    fetchMore: ({
      variables,
      updateQuery,
    }: {
      variables: QueryVariables;
      updateQuery: any;
    }) => void;
    usageReport?: {
      edges: UsageReportNode[];
      pageInfo: {
        currentPage: number;
        totalPage: number;
      };
    };
  };
}

function UsageReport({ usageReportQuery }: Props) {
  const [date, setDate] = React.useState('');
  const [isDownloadReport, downloadReport] = useReportDownload();
  const [isDownloadSummary, downloadSummary] = useReportDownload();

  const columns: ColumnProps<UsageReportNode>[] = [
    {
      key: 'date',
      title: 'Date',
      align: 'center',
      render: function DownloadDetailReport(report: UsageReportNode) {
        if (
          moment(new Date().toISOString()).format('YYYY/MM') === report.node.id
        ) {
          return (
            <>
              {report.node.id}
              <Tooltip title='This report only includes usage up until today, as this month is not over yet.'>
                <Icon
                  type='info-circle'
                  theme='filled'
                  style={{ marginLeft: 8 }}
                />
              </Tooltip>
            </>
          );
        }

        return report.node.id;
      },
    },
    {
      key: 'detailed-report',
      title: 'Detailed Report',
      align: 'center',
      render: function DownloadDetailReport(report: UsageReportNode) {
        return (
          <Tooltip placement='bottom' title='Download'>
            <Button
              icon='vertical-align-bottom'
              onClick={() => {
                const id = report.node.id.replace('/', '_');

                downloadReport({
                  URL: report.node.detailedUrl,
                  fileName: `PrimeHub_Usage_Detalied_${id}.csv`,
                });
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      key: 'summary-report',
      title: 'Summary Report',
      align: 'center',
      render: function DownloadSummarylReport(report: UsageReportNode) {
        return (
          <Tooltip placement='bottom' title='Download'>
            <Button
              icon='vertical-align-bottom'
              onClick={() => {
                const id = report.node.id.replace('/', '_');

                downloadSummary({
                  URL: report.node.summaryUrl,
                  fileName: `PrimeHub_Usage_Summary_${id}.csv`,
                });
              }}
            />
          </Tooltip>
        );
      },
    },
  ];

  if (usageReportQuery.error) {
    return <div>Failure to load usage report data.</div>;
  }

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 24px',
      }}
    >
      <Breadcrumbs
        pathList={[
          {
            key: 'usageReport',
            matcher: /\/usageReport/,
            title: 'Usage Reports',
            tips: 'Admin can download Detailed/Summary reports here to have the insight into the usage here.',
            tipsLink: 'https://docs.primehub.io/docs/guide_manual/admin-report',
          },
        ]}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <Button
          onClick={() => {
            setDate('');

            try {
              usageReportQuery?.refetch({
                usageReportPage: 1,
                usageReportWhere: null,
              });
            } catch (err) {
              console.error(err);
            }
          }}
        >
          Reset
        </Button>
        <Input.Search
          enterButton
          data-testid='search-input'
          placeholder='e.g. 2021/01'
          style={{ width: '160px' }}
          disabled={usageReportQuery.loading}
          value={date}
          onChange={event => setDate(event.currentTarget.value)}
          onSearch={value => {
            setDate(value);

            try {
              usageReportQuery?.refetch({
                usageReportPage: 1,
                usageReportWhere: {
                  id_contains: value,
                },
              });
            } catch (err) {
              console.error(err);
            }
          }}
        />
      </div>

      <Table
        rowKey={data => data.node.id}
        style={{ paddingTop: 8 }}
        columns={columns}
        dataSource={usageReportQuery?.usageReport?.edges}
        loading={
          usageReportQuery.loading || isDownloadReport || isDownloadSummary
        }
        pagination={{
          current: usageReportQuery?.usageReport?.pageInfo.currentPage,
          total: usageReportQuery?.usageReport?.pageInfo.totalPage * 10,

          onChange: page => {
            usageReportQuery?.fetchMore({
              variables: {
                usageReportPage: page,
              },
              updateQuery: (previousResult, { fetchMoreResult }) => {
                if (!fetchMoreResult) {
                  return previousResult;
                }

                return fetchMoreResult;
              },
            });
          },
        }}
      />
    </div>
  );
}

export default compose(
  graphql(UsageReportQuery, {
    name: 'usageReportQuery',
    options: () => {
      return {
        fetchPolicy: 'cache-and-network',
        variables: {
          usageReportPage: 1,
        },
      };
    },
  })
)(UsageReport);
