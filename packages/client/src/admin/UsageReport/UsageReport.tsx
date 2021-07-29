import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, Breadcrumb, Icon, Table, Tooltip, Input } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { UsageReportQuery } from './usageReport.graphql';
import type { TUsageReport } from './types';

function useReportDownload() {
  const [loading, setLoading] = React.useState(false);
  const [token] = useLocalStorage('canner.accessToken', []);

  const downloadReport = React.useCallback(
    ({ URL, fileName }: { URL: string; fileName: string }) => {
      setLoading(true);
      setTimeout(() => {
        fetch(URL, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            setLoading(false);
            return res.blob();
          })
          .then((blob) => {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');

            link.href = url;
            link.setAttribute('download', fileName);

            document.body.appendChild(link);

            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
          });
      }, 10000);
    },
    [token]
  );

  return [loading, downloadReport] as const;
}

function UsageReportTooltip() {
  return (
    <Tooltip
      placement="bottom"
      title={
        <div>
          Admin can download Detailed/Summary reports here to have the insight
          into the usage here.{' '}
          <a
            href="https://docs.primehub.io/docs/guide_manual/admin-report"
            target="_blank"
            rel="noopener"
            style={{ color: '#839ce0' }}
          >
            Learn More.
          </a>
        </div>
      }
    >
      <Icon type="question-circle" />
    </Tooltip>
  );
}

type UsageReportNode = {
  cursor: string;
  node: TUsageReport;
};

interface Props {
  usageReportQuery: {
    error: Error | undefined;
    loading: boolean;
    refetch: (variables: any) => void;
    fetchMore: ({
      variables,
      updateQuery,
    }: {
      variables: any;
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

function _UsageReport({ usageReportQuery }: Props) {
  const [date, setDate] = React.useState('');
  const { appPrefix } = useRoutePrefix();
  const [isDownloadReport, downloadReport] = useReportDownload();
  const [isDownloadSummary, downloadSummary] = useReportDownload();

  const columns: ColumnProps<UsageReportNode>[] = [
    {
      key: 'date',
      title: 'Date',
      dataIndex: 'node.id',
      align: 'center',
    },
    {
      key: 'detailed-report',
      title: 'Detailed Report',
      align: 'center',
      render: function DownloadDetailReport(report: UsageReportNode) {
        return (
          <Button
            icon="vertical-align-bottom"
            onClick={() => {
              const id = report.node.id.replace('/', '_');

              downloadReport({
                URL: report.node.detailedUrl,
                fileName: `PrimeHub_Usage_Detalied_${id}.csv`,
              });
            }}
          />
        );
      },
    },
    {
      key: 'summary-report',
      title: 'Summary Report',
      align: 'center',
      render: function DownloadSummarylReport(report: UsageReportNode) {
        return (
          <Button
            icon="vertical-align-bottom"
            onClick={() => {
              const id = report.node.id.replace('/', '_');

              downloadSummary({
                URL: report.node.summaryUrl,
                fileName: `PrimeHub_Usage_Summary_${id}.csv`,
              });
            }}
          />
        );
      },
    },
  ];

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 24px',
      }}
    >
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link to={`${appPrefix}admin/group`}>
              <Icon type="home" />
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            Usage Report <UsageReportTooltip />
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

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
          placeholder="e.g. 2021/01"
          style={{ width: '160px' }}
          disabled={usageReportQuery.loading}
          value={date}
          onChange={(event) => setDate(event.currentTarget.value)}
          onSearch={(value) => {
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
        rowKey={(data) => data.node.id}
        style={{ paddingTop: 8 }}
        columns={columns}
        dataSource={usageReportQuery?.usageReport?.edges}
        loading={
          usageReportQuery.loading || isDownloadReport || isDownloadSummary
        }
        pagination={{
          current: usageReportQuery?.usageReport?.pageInfo.currentPage,
          total: usageReportQuery?.usageReport?.pageInfo.totalPage * 10,

          onChange: (page) => {
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

export const UsageReport = compose(
  graphql(UsageReportQuery, {
    name: 'usageReportQuery',
    options: () => {
      return {
        variables: {
          usageReportPage: 1,
        },
      };
    },
  })
)(_UsageReport);
