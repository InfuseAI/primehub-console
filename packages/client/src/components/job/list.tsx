import * as React from 'react';
import {Button, Tooltip, Table as AntTable, Row, Col, Icon, Modal} from 'antd';
import {RouteComponentProps} from 'react-router';
import {Link, withRouter} from 'react-router-dom';
import {startCase, get} from 'lodash';
import styled from 'styled-components';
import Filter from 'components/job/filter';
import moment from 'moment';
import {Group} from 'components/job/groupFilter';
import {computeDuration} from 'components/job/detail';
import Pagination from 'components/job/pagination';
import Title from 'components/job/title';
import { Phase, getActionByPhase } from './phase';

const {confirm} = Modal;

const Table = styled(AntTable as any)`
  background: white;
  .ant-pagination.ant-table-pagination {
    margin-right: 16px;
  }
`;

const appPrefix = (window as any).APP_PREFIX || '/';

const renderJobName = (text, record) => (
  <Tooltip
    placement="top"
    title={`Job ID: ${record.id}`}
  >
    <Link to={`${appPrefix}job/${record.id}`}>
      {text}
    </Link>
  </Tooltip>
);

const renderTiming = (text, record) => (
  <Tooltip
    placement="top"
    title={`Create time:\n ${moment(record.createTime).format('DD/MM/YYYY HH:mm:ss')}`}
  >
    {text ? moment(text).fromNow() : '-'}
    <br/>
    {text ? (
      <>
        <Icon type="clock-circle" style={{marginRight: 4, position: 'relative', top: 1}} />
        {computeDuration(text ? moment(text) : '', record.finishTime ? moment(record.finishTime) : '')}
      </>
    ): '-'}
  </Tooltip>
);

type JobsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  },
  edges: Array<{
    cursor: string;
    node: any
  }>
}

type Props = RouteComponentProps & {
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
    currentId: null
  };

  handleCancel = (id: string) => {
    const {jobsConnection, cancelPhJob} = this.props;
    const job = jobsConnection.edges.find(edge => edge.node.id === id).node;
    this.setState({currentId: id});
    confirm({
      title: `Cancel`,
      content: `Do you want to cancel '${job.displayName || job.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: {
        style: {
          float: 'left',
          marginRight: '8px'
        }
      },
      onOk() {
        return cancelPhJob({variables: {where: {id}}});
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }

  handleRerun = (id: string) => {
    const {jobsConnection, rerunPhJob} = this.props;
    const job = jobsConnection.edges.find(edge => edge.node.id === id).node;
    this.setState({currentId: id});
    confirm({
      title: `Rerun`,
      content: `Do you want to rerun '${job.displayName || job.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: {
        style: {
          float: 'left',
          marginRight: '8px'
        }
      },
      onOk() {
        return rerunPhJob({variables: {where: {id}}});
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }

  createPhJob = () => {
    const {history} = this.props;
    history.push(`${appPrefix}job/create`);
  }

  refresh = () => {
    const {jobsVariables, jobsRefetch} = this.props;
    const newVariables = {
      where: jobsVariables.where,
      before: undefined,
      first: 10,
      last: undefined,
      after: undefined,
    };
    jobsRefetch(newVariables);
  }

  nextPage = () => {
    const {jobsVariables, jobsRefetch, jobsConnection} = this.props;
    const after = jobsConnection.pageInfo.endCursor;
    const newVariables = {
      where: jobsVariables.where,
      after,
      first: 10,
      last: undefined,
      before: undefined
    };
    jobsRefetch(newVariables);
  }

  previousPage = () => {
    const {jobsVariables, jobsRefetch, jobsConnection} = this.props;
    const before = jobsConnection.pageInfo.startCursor;
    const newVariables = {
      where: jobsVariables.where,
      before,
      last: 10,
      first: undefined,
      after: undefined,
    };
    jobsRefetch(newVariables);
  }

  changeFilter = ({
    selectedGroups,
    submittedByMe
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => {
    const {jobsVariables, jobsRefetch} = this.props;
    const newVariables = {
      ...jobsVariables,
      where: {
        ...jobsVariables.where,
        groupId_in: selectedGroups,
        mine: submittedByMe,
      }
    };
    jobsRefetch(newVariables);
  }

  render() {
    const {groups, jobsConnection, jobsVariables, cancelPhJobResult, rerunPhJobResult} = this.props;
    const {currentId} = this.state;
    const renderAction = (phase: Phase, record) => {
      const action = getActionByPhase(phase);
      const id = record.id;
      let onClick = () => {}
      if (action.toLowerCase() === 'cancel') {
        onClick = () => this.handleCancel(id);
      } else {
        onClick = () => this.handleRerun(id);
      }
      const loading = cancelPhJobResult.loading && rerunPhJobResult.loading && id === currentId;
      return (
        <Button onClick={onClick} loading={loading}>
          {action}
        </Button>
      )
    }
    const columns = [{
      title: 'Status',
      dataIndex: 'phase',
      key: 'phase',
      render: text => startCase(text)
    }, {
      title: 'Job name',
      dataIndex: 'displayName',
      render: renderJobName
    }, {
      title: 'User',
      dataIndex: 'userName'
    }, {
      title: 'Group',
      dataIndex: 'groupName'
    }, {
      title: 'Timing',
      dataIndex: 'startTime',
      render: renderTiming
    }, {
      title: 'Action',
      dataIndex: 'phase',
      key: 'action',
      render: renderAction
    }]
    return (
      <Row type="flex" gutter={24}>
        <Col span={6}>
          <Filter
            groups={groups}
            selectedGroups={get(jobsVariables, 'where.groupId_in', [])}
            submittedByMe={get(jobsVariables, 'where.mine', false)}
            onChange={this.changeFilter}
          />
        </Col>
        <Col span={18}>
          <Title>Jobs</Title>
          <Button onClick={this.createPhJob}>
            Create Job
          </Button>
          <Button onClick={this.refresh} style={{marginLeft: 16}}>
            Refresh
          </Button>
          <Table
            dataSource={jobsConnection.edges.map(edge => edge.node)}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
          <Pagination
            hasNextPage={jobsConnection.pageInfo.hasNextPage}
            hasPreviousPage={jobsConnection.pageInfo.hasPreviousPage}
            nextPage={this.nextPage}
            previousPage={this.previousPage}
          />
        </Col>
      </Row>
    )
  }
}

export default withRouter(JobList);