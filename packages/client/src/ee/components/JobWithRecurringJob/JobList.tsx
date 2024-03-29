import * as React from 'react';
import moment from 'moment';
import get from 'lodash/get';
import startCase from 'lodash/startCase';
import { Link } from 'react-router-dom';
import { Button, Tooltip, Table, Icon } from 'antd';
import type { ColumnProps, SorterResult } from 'antd/lib/table';

import { TruncateTableField } from 'utils/TruncateTableField';

import {
  computeDuration,
  getCreateTimeAndFinishTime,
  getActionByPhase,
} from './utils';
import type { ActionInfo, Job, PageInfo } from './types';

export type JobNode = {
  cursor: string;
  node: Job;
};

export type JobQueryVariables = {
  where?: {
    id?: string;
    groupId_in?: string[];
    search?: string;
    mine?: boolean;
  };
  orderBy?: {
    displayName?: string;
    schedule?: string;
    createTime?: string;
    userName?: string;
    groupName?: string;
    phase?: string;
  };
  page?: number;
};

export type JobConnections = {
  variables: JobQueryVariables;
  phJobsConnection?: {
    edges: JobNode[];
    pageInfo: PageInfo;
  };
  refetch: (variables?: JobQueryVariables) => Promise<void>;
  loading: boolean;
  error: Error | undefined;
};

interface JobListProps {
  data?: JobConnections;
  searchJob?: React.ReactNode;
  onRerunJob: ({ id, displayName }: ActionInfo) => void;
  onCancelJob: ({ id, displayName }: ActionInfo) => void;
  onCloneJob: (job: Job) => void;
}

export function JobList({ data, ...props }: JobListProps) {
  const columns: ColumnProps<JobNode>[] = [
    {
      title: 'Status',
      dataIndex: 'node.phase',
      key: 'phase',
      sorter: true,
      render: text => startCase(text),
    },
    {
      title: 'Job name',
      sorter: true,
      key: 'displayName',
      width: '300px',
      render: function DisplayName({ node }: JobNode) {
        return (
          <TruncateTableField text={node.displayName}>
            <Link
              to={{
                state: {
                  prevPathname: location.pathname,
                  prevSearch: location.search,
                },
                pathname: `job/${node.id}`,
              }}
            >
              {node.displayName}
            </Link>
          </TruncateTableField>
        );
      },
    },
    {
      title: 'Recurrence',
      dataIndex: 'node.schedule',
      key: 'schedule',
      sorter: true,
      render: text => {
        if (text) {
          return <Link to={`recurringJob/${text}`}>{text}</Link>;
        }

        return '-';
      },
    },
    {
      title: 'User',
      key: 'userName',
      sorter: true,
      dataIndex: 'node.userName',
    },
    {
      title: 'Timing',
      sorter: true,
      key: 'createTime',
      render: function RenderTiming({ node }: JobNode) {
        const createTime = node.createTime;
        const startTime = node.startTime;
        const finishTime = node.finishTime;
        const duration = computeDuration(
          moment(startTime),
          moment(finishTime || new Date().toISOString())
        );

        const { startTime: startTimeText, finishTime: finishTimeText } =
          getCreateTimeAndFinishTime(startTime, finishTime, node.phase);

        return (
          <>
            <Tooltip
              overlayStyle={{ maxWidth: 300 }}
              placement='top'
              title={`Creation time: ${moment(createTime).format(
                'YYYY-MM-DD HH:mm:ss'
              )}`}
            >
              {createTime ? moment(createTime).fromNow() : '-'}
              <br />
            </Tooltip>
            <Tooltip
              overlayStyle={{ maxWidth: 300 }}
              placement='top'
              title={
                <>
                  Start time: {startTimeText}
                  <br />
                  Finished time: {finishTimeText}
                </>
              }
            >
              {startTime ? (
                <div>
                  <Icon
                    type='clock-circle'
                    style={{ marginRight: 4, position: 'relative', top: 1 }}
                  />
                  {duration}
                </div>
              ) : (
                '-'
              )}
            </Tooltip>
          </>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: function RenderAction({ node }: JobNode) {
        const action = getActionByPhase(node.phase);

        return (
          <Button.Group>
            {action.toLowerCase() === 'cancel' ? (
              <Tooltip placement='bottom' title='Cancel'>
                <Button
                  data-testid={`cancel-${node.displayName}-job`}
                  icon='close-circle'
                  onClick={() =>
                    props.onCancelJob({
                      id: node.id,
                      displayName: node.displayName,
                    })
                  }
                />
              </Tooltip>
            ) : (
              [
                <Tooltip key='re-run' placement='bottom' title='Re-run'>
                  <Button
                    key='re-run'
                    data-testid={`rerun-${node.displayName}-job`}
                    icon='caret-right'
                    onClick={() =>
                      props.onRerunJob({
                        id: node.id,
                        displayName: node.displayName,
                      })
                    }
                  />
                </Tooltip>,
                <Tooltip key='clone' placement='bottom' title='Clone'>
                  <Button
                    key='clone-job'
                    data-testid={`clone-${node.displayName}-job`}
                    icon='copy'
                    onClick={() => props.onCloneJob(node)}
                  />
                </Tooltip>,
              ]
            )}
          </Button.Group>
        );
      },
    },
  ];

  function handleTableChange(
    pagination: { current: number; total: number; pageSize: number },
    _,
    sorter: SorterResult<JobNode>
  ) {
    const variables: JobQueryVariables = {
      ...data.variables,
      page: pagination.current,
    };

    if (sorter.columnKey && sorter.order) {
      const orderByColumn = {
        [sorter.columnKey]: sorter.order === 'ascend' ? 'asc' : 'desc',
      };

      variables.orderBy = orderByColumn;
    } else {
      variables.orderBy = {};
    }

    data.refetch(variables);
  }

  return (
    <>
      {props?.searchJob}
      <Table
        data-testid={data?.loading ? 'loading-job-list' : 'job-list'}
        rowKey={data => data.node.id}
        columns={columns}
        loading={get(data, 'loading', false)}
        dataSource={get(data, 'phJobsConnection.edges', [])}
        onChange={handleTableChange}
        pagination={{
          current: get(data, 'phJobsConnection.pageInfo.currentPage', 1),
          total: get(data, 'phJobsConnection.pageInfo.totalPage', 1) * 10,
        }}
      />
    </>
  );
}
