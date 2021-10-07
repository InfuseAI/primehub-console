import * as React from 'react';
import { Button, Tooltip, Table as AntTable, Modal } from 'antd';
import { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import moment from 'moment';
import { get } from 'lodash';
import styled from 'styled-components';
import Filter from '../shared/filter';
import { Group } from '../shared/groupFilter';
import { renderRecurrence } from './recurrence';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import { TruncateTableField } from 'utils/TruncateTableField';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/schedule/,
    title: 'Schedule',
    link: '/schedule?page=1',
    tips: 'Users can schedule jobs routinely.',
    tipsLink: 'https://docs.primehub.io/docs/job-scheduling-feature',
  },
];

const { confirm } = Modal;

const Table = styled(AntTable as any)`
  background: white;
  .ant-pagination.ant-table-pagination {
    margin-right: 16px;
  }
`;

const renderNextRunTime = (time, record) => {
  if (record.invalid) {
    return (
      <Tooltip
        placement='top'
        title={record.message || 'This schedule is invalid'}
      >
        <span style={{ color: 'red' }}>Invalid</span>
      </Tooltip>
    );
  }
  const tooltipTime = time ? moment(time).format('YYYY-MM-DD HH:mm') : '-';
  const text = time ? moment(time).fromNow() : '-';
  return (
    <Tooltip placement='top' title={`Scheduled for: ${tooltipTime}`}>
      {text}
    </Tooltip>
  );
};

type JobsConnection = {
  pageInfo: {
    totalPage: number;
    currentPage: number;
  };
  edges: Array<{
    cursor: string;
    node: any;
  }>;
};

type Props = RouteComponentProps &
  GroupContextComponentProps & {
    groups: Array<Group>;
    schedulesLoading: boolean;
    schedulesError: any;
    schedulesConnection: JobsConnection;
    schedulesVariables: any;
    schedulesRefetch: Function;
    runPhSchedule: Function;
    deletePhSchedule: Function;
    runPhScheduleResult: any;
    deletePhScheduleResult: any;
  };

class ScheduleList extends React.Component<Props> {
  state = {
    currentId: null,
  };

  deleteSchedule = (id: string) => {
    const { schedulesConnection, deletePhSchedule } = this.props;
    const schedule = schedulesConnection.edges.find(
      edge => edge.node.id === id
    ).node;
    this.setState({ currentId: id });
    confirm({
      title: `Delete`,
      content: `Are you sure you want to delete '${schedule.displayName}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      maskClosable: true,
      onOk() {
        return deletePhSchedule({ variables: { where: { id } } });
      },
    });
  };

  runJob = (id: string) => {
    const { runPhSchedule } = this.props;
    runPhSchedule({ variables: { where: { id } } });
  };

  editJob = (id: string) => {
    const { history, location } = this.props;
    history.push(`schedule/${id}`, {
      prevPathname: location.pathname,
      prevSearch: location.search,
    });
  };

  scheduleJob = () => {
    const { history } = this.props;
    history.push(`schedule/create`);
  };

  refresh = () => {
    const { schedulesVariables, schedulesRefetch } = this.props;
    const newVariables = {
      ...schedulesVariables,
      page: 1,
    };
    schedulesRefetch(newVariables);
  };

  changeFilter = ({
    selectedGroups,
    submittedByMe,
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => {
    const { groupContext, schedulesVariables, schedulesRefetch } = this.props;
    const newVariables = {
      ...schedulesVariables,
      where: {
        ...schedulesVariables.where,
        mine: submittedByMe,
      },
    };

    if (!groupContext) {
      newVariables.where.groupId_in = selectedGroups;
    }

    schedulesRefetch(newVariables);
  };

  searchHandler = queryString => {
    const { groupContext, schedulesVariables, schedulesRefetch } = this.props;
    if (queryString && queryString.length > 0) {
      const newVariables = {
        ...schedulesVariables,
        where: {
          ...schedulesVariables.where,
          displayName_contains: queryString,
        },
      };
    }
    schedulesRefetch(newVariables);
  };

  handleTableChange = (pagination, _filters, sorter) => {
    const { schedulesVariables, schedulesRefetch } = this.props;
    schedulesRefetch({
      ...schedulesVariables,
      page: pagination.current,
      orderBy: sorter.field
        ? {
            [sorter.field]: get(sorter, 'order') === 'ascend' ? 'asc' : 'desc',
          }
        : {},
    });
  };

  render() {
    const {
      groupContext,
      groups,
      schedulesConnection,
      schedulesLoading,
      schedulesVariables,
    } = this.props;
    const renderAction = (id: string, record) => {
      return (
        <Button.Group>
          <Tooltip placement='bottom' title='Run'>
            <Button
              icon='caret-right'
              onClick={() => this.runJob(id)}
              disabled={record.invalid}
            />
          </Tooltip>
          <Tooltip placement='bottom' title='Edit'>
            <Button icon='edit' onClick={() => this.editJob(id)} />
          </Tooltip>
          <Tooltip placement='bottom' title='Delete'>
            <Button icon='delete' onClick={() => this.deleteSchedule(id)} />
          </Tooltip>
        </Button.Group>
      );
    };
    const columns = [
      {
        title: 'Name',
        dataIndex: 'displayName',
        sorter: true,
        width: '30%',
        render: text => <TruncateTableField text={text} defaultCharacter='-' />,
      },
      {
        title: 'Recurrence',
        dataIndex: 'recurrence',
        width: '20%',
        render: ({ type, cron }) => renderRecurrence(type, cron),
      },
      {
        title: 'Next Run',
        dataIndex: 'nextRunTime',
        sorter: true,
        width: '20%',
        render: renderNextRunTime,
      },
      {
        title: 'Created By',
        dataIndex: 'userName',
        sorter: true,
        width: '20%',
        render: text => <TruncateTableField text={text} defaultCharacter='-' />,
      },
      {
        title: 'Action',
        dataIndex: 'id',
        width: '10%',
        render: renderAction,
      },
    ];
    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Schedule'}
        />
        <PageBody>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
            }}
          >
            <InfuseButton
              icon='plus'
              onClick={this.scheduleJob}
              style={{ width: 140 }}
              type='primary'
            >
              New Schedule
            </InfuseButton>
            <InfuseButton onClick={this.refresh} style={{ marginLeft: 16 }}>
              Refresh
            </InfuseButton>
          </div>
          <Filter
            groupContext={groupContext}
            groups={groups}
            searchHandler={this.searchHandler}
            resourceKey='schedule'
            selectedGroups={get(schedulesVariables, 'where.groupId_in', [])}
            submittedByMe={get(schedulesVariables, 'where.mine', false)}
            onChange={this.changeFilter}
          />
          <Table
            dataSource={schedulesConnection.edges.map(edge => edge.node)}
            columns={columns}
            rowKey='id'
            loading={schedulesLoading}
            pagination={{
              current: get(schedulesConnection, 'pageInfo.currentPage', 0),
              total: get(schedulesConnection, 'pageInfo.totalPage', 0) * 10,
            }}
            onChange={this.handleTableChange}
          />
        </PageBody>
      </>
    );
  }
}

export default withRouter(ScheduleList);
