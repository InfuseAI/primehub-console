import * as React from 'react';
import {Button, Tooltip, Table as AntTable, Row, Col} from 'antd';
import {Link} from 'react-router-dom';
import {startCase, get} from 'lodash';
import styled from 'styled-components';
import Filter from 'components/job/filter';
import moment from 'moment';
import {Group} from 'components/job/groupFilter';
import Pagination from 'components/job/pagination';
import { Phase, getActionByPhase } from './phase';

const Title = styled.h2`
  display: inline-block;
  margin-right: 24px;
`;

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
    {moment(text).fromNow()}
    <br/>
    {moment(text).format('HH:mm:ss')}
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

type Props = {
  groups: Array<Group>;
  jobsLoading: boolean;
  jobsError: any;
  jobsConnection: JobsConnection;
  jobsVariables: any;
  jobsRefetch: Function;
};

export default class JobList extends React.Component<Props> {
  handleCancel = (id: string) => {

  }

  handleRerun = (id: string) => {

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
    const {groups, jobsConnection, jobsVariables} = this.props;
    const renderAction = (phase: Phase, record) => {
      const action = getActionByPhase(phase);
      const id = record.id;
      let onClick = () => {}
      if (action.toLowerCase() === 'cancel') {
        onClick = () => this.handleCancel(id);
      }
      onClick = () => this.handleRerun(id);
      return (
        <Button onClick={onClick}>
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
          <Button>
            Create Job
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