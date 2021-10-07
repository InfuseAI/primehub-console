import React from 'react';
import { Table } from 'antd';
import { TruncateTableField } from 'utils/TruncateTableField';

interface EnvVar {
  name: string;
  value: string;
}

export default function EnvList({
  envList,
  valueVisibility,
}: {
  envList: EnvVar[];
  valueVisibility: boolean;
}) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      width: '30%',
      render: text => <TruncateTableField text={text} />,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: value => {
        const text = valueVisibility ? value : value.replace(/([\w\W])/g, '*');

        return <TruncateTableField text={text} />;
      },
    },
  ];
  return (
    <Table
      rowKey={(_, index) => `${index}`}
      columns={columns}
      dataSource={envList}
      scroll={{ y: 240 }}
      size='small'
      pagination={false}
    />
  );
}
