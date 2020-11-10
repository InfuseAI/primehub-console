import React from 'react';
import {Table} from 'antd';

interface EnvVar {
  name: string;
  value: string;
}

export default function EnvList({envList}: {envList: EnvVar[]}) {
  const columns = [{
    title: 'Name',
    dataIndex: 'name',
    width: 20,
    render: value => <div style={{wordBreak: 'break-word'}}>{value}</div>
  }, {
    title: 'Value',
    dataIndex: 'value',
    width: 80,
    render: value => <div style={{wordBreak: 'break-word'}}>{value}</div>
  }];
  return (
    <Table
      columns={columns}
      dataSource={envList}
      scroll={{y: 120}}
      size="small"
      pagination={false}
    />
  )
}
