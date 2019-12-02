import * as React from 'react';
import {Button, Tooltip, Table as AntTable, Row, Col} from 'antd';
import {Link} from 'react-router-dom';
import {startCase} from 'lodash';
import styled from 'styled-components';
import Filter from 'components/job/filter';
import moment from 'moment';

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

export enum STATUS {
  SUCCEED = 'SUCCEED',
  FAILED = 'FAILED'
};

const dataSource = [{
  id: 'y23456',
  status: STATUS.SUCCEED,
  name: 'train_123 model by using yyy_pretrained_model',
  user: {
    username: 'Alice'
  },
  group: {
    displayName: 'dev-group'
  },
  createTime: new Date().toString()
}];

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

const columns = [{
  title: 'Status',
  dataIndex: 'status',
  render: text => startCase(text)
}, {
  title: 'Job name',
  dataIndex: 'name',
  render: renderJobName
}, {
  title: 'User',
  dataIndex: 'user.username'
}, {
  title: 'Group',
  dataIndex: 'group.displayName'
}, {
  title: 'Timing',
  dataIndex: 'createDate',
  render: renderTiming
}, {
  title: 'Action',
  dataIndex: 'action',
  render: () => (
    <a>
      Rerun
    </a>
  )
}]

const groups = [{
  displayName: 'dev-group',
  id: 'group1'
}, {
  displayName: 'dev-group2',
  id: 'group2'
}, {
  displayName: 'dev-group3',
  id: 'group3'
}, {
  displayName: 'dev-group4',
  id: 'group4'
}];

export default class JobList extends React.Component {
  render() {
    return (
      <Row type="flex" gutter={24}>
        <Col span={6}>
          <Filter
            groups={groups}
          />
        </Col>
        <Col span={18}>
          <Title>Jobs</Title>
          <Button>
            Create Job
          </Button>
          <Table
            dataSource={dataSource}
            columns={columns}
            rowKey="id"
          />
        </Col>
      </Row>
    )
  }
}