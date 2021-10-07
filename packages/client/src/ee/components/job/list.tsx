import * as React from 'react';
import { Button, Tooltip, Table as AntTable, Icon, Modal } from 'antd';
import { RouteComponentProps } from 'react-router';
import { Link, withRouter } from 'react-router-dom';
import { startCase, get } from 'lodash';
import styled from 'styled-components';
import Filter from '../shared/filter';
import moment from 'moment';
import { Group } from '../shared/groupFilter';
import { computeDuration } from './detail';
import { Phase, getActionByPhase } from './phase';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import { TruncateTableField } from 'utils/TruncateTableField';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/job/,
    title: 'Jobs',
    link: '/job?page=1',
    tips: 'Users can submit time-consuming tasks as jobs here.',
    tipsLink: 'https://docs.primehub.io/docs/job-submission-feature',
  },
];

const { confirm } = Modal;
const Table = styled(AntTable as any)`
  background: white;
  .ant-pagination.ant-table-pagination {
    margin-right: 16px;
  }
`;

const renderSchedule = text =>
  text ? <Link to={`schedule/${text}`}>{text}</Link> : '-';

const renderTimeIfValid = time => {
  if (!time) {
    return '-';
  }

  const momentTime = moment(time);
  return momentTime.isValid() ? momentTime.format('YYYY-MM-DD HH:mm:ss') : '-';
};

const getCreateTimeAndFinishTime = (startTime, finishTime, phase: Phase) => {
  switch (phase) {
    case Phase.Pending:
    case Phase.Preparing:
      return {
        startTime: '-',
        finishTime: '-',
      };

    case Phase.Running:
      return {
        startTime: renderTimeIfValid(startTime),
        finishTime: '-',
      };

    default:
      return {
        startTime: renderTimeIfValid(startTime),
        finishTime: renderTimeIfValid(finishTime),
      };
  }
};

const renderTiming = (_, record) => {
  const createTime = record.createTime;
  const startTime = record.startTime;
  const finishTime = record.finishTime;
  const duration = computeDuration(
    moment(startTime),
    moment(finishTime || new Date().toISOString())
  );
  const { startTime: startTimeText, finishTime: finishTimeText } =
    getCreateTimeAndFinishTime(startTime, finishTime, record.phase);
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
};

type JobsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
  edges: Array<{
    cursor: string;
    node: any;
  }>;
};

type Props = RouteComponentProps &
  GroupContextComponentProps & {
    groups: Array<Group>;
    jobsLoading: boolean;
    jobsError: any;
    jobsConnection: JobsConnection;
    jobsVariables: any;
    jobsRefetch: Function;
    rerunPhJob: Function;
    cancelPhJob: Function;
    rerunPhJobResult: any;
    cancelPhJobResult: any;
  };

class JobList extends React.Component<Props> {
  state = {
    currentId: null,
  };

  handleCancel = (id: string) => {
    const { jobsConnection, cancelPhJob } = this.props;
    const job = jobsConnection.edges.find(edge => edge.node.id === id).node;
    this.setState({ currentId: id });
    confirm({
      title: `Cancel`,
      content: `Do you want to cancel '${job.displayName || job.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      maskClosable: true,
      onOk() {
        return cancelPhJob({ variables: { where: { id } } });
      },
    });
  };

  handleRerun = (id: string) => {
    const { jobsConnection, rerunPhJob } = this.props;
    const job = jobsConnection.edges.find(edge => edge.node.id === id).node;
    this.setState({ currentId: id });
    confirm({
      title: `Rerun`,
      content: `Do you want to rerun '${job.displayName || job.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      maskClosable: true,
      onOk() {
        return rerunPhJob({ variables: { where: { id } } });
      },
    });
  };

  createPhJob = () => {
    const { history } = this.props;
    history.push(`job/create`);
  };

  refresh = () => {
    const { jobsVariables, jobsRefetch } = this.props;
    const newVariables = {
      ...jobsVariables,
      page: 1,
    };
    jobsRefetch(newVariables);
  };

  changeFilter = ({
    selectedGroups,
    submittedByMe,
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => {
    const { groupContext, jobsVariables, jobsRefetch } = this.props;
    const newVariables = {
      ...jobsVariables,
      where: {
        ...jobsVariables.where,
        mine: submittedByMe,
      },
    };

    if (!groupContext) {
      newVariables.where.groupId_in = selectedGroups;
    }

    jobsRefetch(newVariables);
  };

  searchHandler = queryString => {
    const { jobsVariables, jobsRefetch } = this.props;
    let newVariables = jobsVariables;
    if (queryString && queryString.length > 0) {
      newVariables = {
        ...jobsVariables,
        where: {
          ...jobsVariables.where,
          displayName_contains: queryString,
        },
      };
    }
    jobsRefetch(newVariables);
  };

  handleTableChange = (pagination, _filters, sorter) => {
    const { jobsVariables, jobsRefetch } = this.props;
    const orderBy = {};
    if (sorter.field) {
      orderBy[sorter.field] =
        get(sorter, 'order') === 'ascend' ? 'asc' : 'desc';
    }
    jobsRefetch({
      ...jobsVariables,
      page: pagination.current,
      orderBy,
    });
  };

  cloneJob = record => {
    const { groupContext, history } = this.props;
    const data = {
      displayName: record.displayName,
      groupId: !groupContext ? record.groupId : groupContext.id,
      groupName: !groupContext ? record.groupName : groupContext.name,
      instanceTypeId: get(record, 'instanceType.id'),
      instanceTypeName:
        get(record, 'instanceType.displayName') ||
        get(record, 'instanceType.name'),
      image: record.image,
      command: record.command,
    };
    history.push(
      `job/create?defaultValue=${encodeURIComponent(JSON.stringify(data))}`
    );
  };

  render() {
    const {
      groupContext,
      groups,
      jobsConnection,
      jobsLoading,
      jobsVariables,
      cancelPhJobResult,
      rerunPhJobResult,
    } = this.props;
    const { currentId } = this.state;
    const renderAction = (phase: Phase, record) => {
      const action = getActionByPhase(phase);
      const id = record.id;
      const loading =
        cancelPhJobResult.loading &&
        rerunPhJobResult.loading &&
        id === currentId;
      return (
        <Button.Group>
          {action.toLowerCase() === 'cancel' ? (
            <Tooltip placement='bottom' title='Cancel'>
              <Button
                icon='close-circle'
                onClick={() => this.handleCancel(id)}
                loading={loading}
              />
            </Tooltip>
          ) : (
            [
              <Tooltip key='re-run' placement='bottom' title='Re-run'>
                <Button
                  key='re-run'
                  icon='caret-right'
                  onClick={() => this.handleRerun(id)}
                  loading={loading}
                />
              </Tooltip>,
              <Tooltip key='clone' placement='bottom' title='Clone'>
                <Button
                  key='clone-job'
                  icon='copy'
                  onClick={() => this.cloneJob(record)}
                />
              </Tooltip>,
            ]
          )}
        </Button.Group>
      );
    };
    const columns = [
      {
        title: 'Status',
        dataIndex: 'phase',
        key: 'phase',
        sorter: true,
        render: text => startCase(text),
      },
      {
        title: 'Job name',
        dataIndex: 'displayName',
        sorter: true,
        width: '300px',
        render: (text, record) => (
          <TruncateTableField text={text}>
            <Link
              to={{
                state: {
                  prevPathname: location.pathname,
                  prevSearch: location.search,
                },
                pathname: `job/${record.id}`,
              }}
            >
              {text}
            </Link>
          </TruncateTableField>
        ),
      },
      {
        title: 'Schedule',
        dataIndex: 'schedule',
        sorter: true,
        render: renderSchedule,
      },
      {
        title: 'User',
        sorter: true,
        dataIndex: 'userName',
      },
      {
        title: 'Timing',
        sorter: true,
        key: 'timing',
        dataIndex: 'createTime',
        render: renderTiming,
      },
      {
        title: 'Action',
        dataIndex: 'phase',
        key: 'action',
        render: renderAction,
        width: 200,
      },
    ];

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Jobs'}
        />
        <PageBody>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
            }}
          >
            {/* @ts-ignore */}
            <InfuseButton
              icon='plus'
              onClick={this.createPhJob}
              style={{ marginRight: 16, width: 120 }}
              type='primary'
            >
              New Job
            </InfuseButton>
            {/* @ts-ignore */}
            <InfuseButton onClick={this.refresh}>Refresh</InfuseButton>
          </div>
          <Filter
            groupContext={groupContext}
            groups={groups}
            selectedGroups={get(jobsVariables, 'where.groupId_in', [])}
            submittedByMe={get(jobsVariables, 'where.mine', false)}
            resourceKey='job'
            searchHandler={this.searchHandler}
            onChange={this.changeFilter}
          />
          <Table
            loading={jobsLoading}
            dataSource={jobsConnection.edges.map(edge => edge.node)}
            columns={columns}
            rowKey='id'
            pagination={{
              current: get(jobsConnection, 'pageInfo.currentPage', 0),
              total: get(jobsConnection, 'pageInfo.totalPage', 0) * 10,
            }}
            onChange={this.handleTableChange}
          />
        </PageBody>
      </>
    );
  }
}

export default withRouter(JobList);
