import React from 'react';
import moment from 'moment';
import get from 'lodash/get';
import { Button, Tooltip, Table } from 'antd';
import { useHistory } from 'react-router-dom';
import type { ColumnProps, SorterResult } from 'antd/lib/table';

import { TruncateTableField } from 'utils/TruncateTableField';
import type { TInstanceType } from 'admin/InstanceTypes/types';

import { RecurrenceType, renderRecurrence } from './Recurrence';
import type { ActionInfo, Job } from './types';

export type Schedule = {
  id: string;
  displayName: string;
  recurrence: {
    type: RecurrenceType;
    cron: string;
  };
  invalid: boolean;
  message: string;
  command: string;
  groupId: string;
  groupName: string;
  image: string;
  instanceType: Pick<
    TInstanceType,
    'id' | 'name' | 'displayName' | 'cpuLimit' | 'memoryLimit' | 'gpuLimit'
  >;
  userId: string;
  userName: string;
  nextRunTime: string | null;
  activeDeadlineSeconds: number;
};

export type ScheduleNode = {
  cursor: string;
  node: Schedule;
};

export type ScheduleQueryVariables = {
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

export type ScheduleConnections = {
  variables: ScheduleQueryVariables;
  phSchedulesConnection: {
    edges: ScheduleNode[];
    pageInfo: {
      currentPage: number;
      totalPage: number;
    };
  };
  refetch: (variables?: ScheduleQueryVariables) => Promise<void>;
  loading: boolean;
  error: Error | undefined;
};

export type ScheduleActionVariables = {
  variables: {
    where: {
      id: string;
    };
  };
};

export type RunSchedule = {
  data: {
    runPhSchedule: {
      job: Pick<Job, 'id' | 'displayName'>;
    };
  };
};

interface RecurringJobListProps {
  data: ScheduleConnections;
  onRunRecurringJob: ({ id, displayName }: ActionInfo) => void;
  onDeleteRecurringJob: ({ id, displayName }: ActionInfo) => void;
}

export function RecurringJobList({ data, ...props }: RecurringJobListProps) {
  const history = useHistory();

  const columns: ColumnProps<ScheduleNode>[] = [
    {
      title: 'Name',
      key: 'displayName',
      sorter: true,
      width: '30%',
      render: function RenderName({ node }: ScheduleNode) {
        return (
          <TruncateTableField text={node.displayName} defaultCharacter='-' />
        );
      },
    },
    {
      title: 'Recurrence',
      dataIndex: 'node.recurrence',
      width: '20%',
      render: ({ type, cron }) => renderRecurrence(type, cron),
    },
    {
      title: 'Next Run',
      key: 'nextRunTime',
      sorter: true,
      width: '20%',
      render: function RenderNextRun({ node }: ScheduleNode) {
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
      render: function RenderUsername({ node }: ScheduleNode) {
        return <TruncateTableField text={node.userName} defaultCharacter='-' />;
      },
    },
    {
      title: 'Action',
      width: '150px',
      render: function RenderAction({ node }: ScheduleNode) {
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
    sorter: SorterResult<ScheduleNode>
  ) {
    const variables: ScheduleQueryVariables = {
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
