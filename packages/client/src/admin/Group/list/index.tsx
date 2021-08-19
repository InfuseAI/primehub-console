import * as React from 'react';
import { filter } from 'lodash';
import { Table } from 'antd';

interface Props {
  dataSource: any[];
  columns?: any[];
  loading?: boolean;
  pagination?: any;
  onChange?: any;
}

export function List(props: Props) {
  // Extend the column config, a condition visible config.
  const columns = filter(props.columns, obj => obj.visible !== false);
  return (
    <React.Fragment>
      <Table
        loading={props.loading}
        dataSource={props.dataSource}
        columns={columns}
        rowKey={record => record.id}
        onChange={props.onChange}
        pagination={props.pagination}
      />
    </React.Fragment>
  );
}
