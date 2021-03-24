import React from 'react';
import {Table} from 'antd';

interface EnvVar {
  name: string;
  value: string;
}

export default function EnvList({envList, valueVisibility}: {envList: EnvVar[], valueVisibility: boolean}) {
  const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: '30%',
    render: value => <span style={{wordBreak: 'break-word'}}>{value}</span>
  }, {
    title: 'Value',
    dataIndex: 'value',
    render: value => <span style={{wordBreak: 'break-word'}}>{valueVisibility ? value : value.replace(/([\w\W])/g, '*')}</span>
  }
  ];
  return (
    <Table
      columns={columns}
      dataSource={envList}
      scroll={{ y: 240 }}
      size='small'
      pagination={false}
    />
  );
}
