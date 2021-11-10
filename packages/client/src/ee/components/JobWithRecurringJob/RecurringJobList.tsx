import React from 'react';
import moment from 'moment';
import get from 'lodash/get';
import startCase from 'lodash/startCase';
import { Button, Tooltip, Table } from 'antd';
import { useHistory } from 'react-router-dom';
import type { ColumnProps, SorterResult } from 'antd/lib/table';

import { TruncateTableField } from 'utils/TruncateTableField';
import type { TInstanceType } from 'admin/InstanceTypes/types';

import type {
  ActionInfo,
  Job,
  Recurrence,
  RecurringJob as TRecurringJob,
} from './types';

interface RecurringJob extends Omit<TRecurringJob, 'instanceType'> {
  instanceType: Pick<
    TInstanceType,
    'id' | 'name' | 'displayName' | 'cpuLimit' | 'memoryLimit' | 'gpuLimit'
  >;
}

export type RecurringJobNode = {
  cursor: string;
  node: RecurringJob;
};

export type RecurringJobQueryVariables = {
  where?: {
    id?: string;
    groupId_in?: string[];
    displayName_contains?: string;
    search?: string;
    mine?: boolean;
  };
  orderBy?: {
    displayName?: string;
    groupName?: string;
    userName?: string;
    nextRunTime?: string;
    createTime?: string;
  };
  page?: number;
};

export type RecurringJobConnections = {
  variables: RecurringJobQueryVariables;
  phSchedulesConnection?: {
    edges: RecurringJobNode[];
    pageInfo: {
      currentPage: number;
      totalPage: number;
    };
  };
  refetch: (variables?: RecurringJobQueryVariables) => Promise<void>;
  loading: boolean;
  error: Error | undefined;
};

export type RecurringJobActionVariables = {
  variables: {
    where: {
      id: string;
    };
  };
};

export type RunRecurringJob = {
  data: {
    runPhSchedule: {
      job: Pick<Job, 'id' | 'displayName'>;
    };
  };
};

interface RecurringJobListProps {
  data?: RecurringJobConnections;
  onRunRecurringJob: ({ id, displayName }: ActionInfo) => void;
  onDeleteRecurringJob: ({ id, displayName }: ActionInfo) => void;
}

export function RecurringJobList({ data, ...props }: RecurringJobListProps) {
  const history = useHistory();

  const columns: ColumnProps<RecurringJobNode>[] = [
    {
      title: 'Name',
      key: 'displayName',
      sorter: true,
      width: '30%',
      render: function RenderName({ node }: RecurringJobNode) {
        return (
          <TruncateTableField text={node.displayName} defaultCharacter='-' />
        );
      },
    },
    {
      title: 'Recurrence',
      dataIndex: 'node.recurrence',
      width: '20%',
      render: ({ type, cron }: Recurrence) => {
        switch (type) {
          case 'custom':
            return cron;
          case 'daily':
          case 'monthly':
          case 'weekly':
          case 'inactive':
            return startCase(type);
        }
      },
    },
    {
      title: 'Next Run',
      key: 'nextRunTime',
      sorter: true,
      width: '20%',
      render: function RenderNextRun({ node }: RecurringJobNode) {
        const time = node.nextRunTime;

        if (node.invalid) {
          return (
            <Tooltip
              placement='top'
              title={node.message || 'This schedule is invalid'}
            >
              <span style={{ color: 'red' }}>Invalid</span>
            </Tooltip>
          );
        }

        const text = time ? moment(time).fromNow() : '-';
        const tooltipTime = time
          ? moment(time).format('YYYY-MM-DD HH:mm')
          : '-';

        return (
          <Tooltip placement='top' title={`Scheduled for: ${tooltipTime}`}>
            {text}
          </Tooltip>
        );
      },
    },
    {
      title: 'Created By',
      key: 'userName',
      sorter: true,
      width: '20%',
      render: function RenderUsername({ node }: RecurringJobNode) {
        return <TruncateTableField text={node.userName} defaultCharacter='-' />;
      },
    },
    {
      title: 'Action',
      width: '150px',
      render: function RenderAction({ node }: RecurringJobNode) {
        return (
          <Button.Group>
            <Tooltip placement='bottom' title='Run'>
              <Button
                icon='caret-right'
                onClick={() =>
                  props.onRunRecurringJob({
                    id: node.id,
                    displayName: node.displayName,
                  })
                }
                disabled={node.invalid}
              />
            </Tooltip>
            <Tooltip placement='bottom' title='Edit'>
              <Button
                icon='edit'
                onClick={() => {
                  history.push(`recurringJob/${node.id}`);
                }}
              />
            </Tooltip>
            <Tooltip placement='bottom' title='Delete'>
              <Button
                icon='delete'
                onClick={() =>
                  props.onDeleteRecurringJob({
                    id: node.id,
                    displayName: node.displayName,
                  })
                }
              />
            </Tooltip>
          </Button.Group>
        );
      },
    },
  ];

  function handleTableChange(
    pagination: { current: number; total: number; pageSize: number },
    _,
    sorter: SorterResult<RecurringJobNode>
  ) {
    const variables: RecurringJobQueryVariables = {
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
    <Table
      rowKey={data => data.node.id}
      columns={columns}
      loading={get(data, 'loading', false)}
      dataSource={get(data, 'phSchedulesConnection.edges', [])}
      onChange={handleTableChange}
      pagination={{
        current: get(data, 'phSchedulesConnection.pageInfo.currentPage', 1),
        total: get(data, 'phSchedulesConnection.pageInfo.totalPage', 1) * 10,
      }}
    />
  );
}
