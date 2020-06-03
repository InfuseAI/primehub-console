import React from 'react';
import {Table} from 'antd';

export default function Metadata({metadata}: {metadata: object}) {
  const metadataList = Object.keys(metadata || {}).map(key => ({
    key,
    value: metadata[key]
  }));
  const columns = [{
    title: 'Name',
    dataIndex: 'key',
    width: '30%',
    render: value => <div style={{wordBreak: 'break-word'}}>{value}</div>
  }, {
    title: 'Value',
    dataIndex: 'value',
    width: '70%',
    render: value => <div style={{wordBreak: 'break-word'}}>{value}</div>
  }];
  return (
    <Table
      style={{border: '1px solid #eee'}}
      columns={columns}
      dataSource={metadataList}
      scroll={{y: 207}}
      size="middle"
      pagination={false}
    />
  )
}
