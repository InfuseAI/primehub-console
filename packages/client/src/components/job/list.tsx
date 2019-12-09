import * as React from 'react';
import {Button, Tooltip, Table as AntTable, Row, Col} from 'antd';
import {Link} from 'react-router-dom';
import {startCase} from 'lodash';
import styled from 'styled-components';
import Filter from 'components/job/filter';
import moment from 'moment';
import {Group} from 'components/job/groupFilter';
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

const renderJobName = (text, record) => (
  <Tooltip
    placement="top"
    title={`Job ID: ${record.id}`}
  >
    <Link to={`/job/${record.id}`}>
      {text}
    </Link>
  </Tooltip>
);

const renderTiming = text => (
  <Tooltip
    placement="top"
    title={`Create time:\n ${moment(text).format('DD/MM/YYYY HH:mm:ss')}`}
  >
    {moment(text).fromNow()}
    <br/>
    {moment(text).format('HH:mm:ss')}
  </Tooltip>
);

type JobsConnection = {
  pageInfo: {
    hasNextpage: boolean;
    hasPreviousPage: boolean;
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
  groupsLoading: boolean;
  groupsError: any
};

export default class JobList extends React.Component<Props> {
  handleCancel = (id: string) => {

  }

  handleRerun = (id: string) => {

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
        group_in: selectedGroups,
        mine: submittedByMe,
      }
    };
    jobsRefetch({
      variables: newVariables
    });
  }

  render() {
    const {groups, jobsConnection} = this.props;
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
      title: 'Phase',
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
      dataIndex: 'group'
    }, {
      title: 'Timing',
      dataIndex: 'createDate',
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
            pagination={"test"}

          />
        </Col>
      </Row>
    )
  }
}