import * as React from 'react';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { Table } from 'antd';
import styled from 'styled-components';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import { GroupUsages } from 'queries/Group.graphql';
import { ThinTitle } from './recentTasks';

interface GroupProps {
  resourceStatus: {
    cpuUsage: string;
    gpuUsage: string;
    memUsage: string;
  };
  resourceDetails: {
    details: Array<{
      name: string;
      type: string;
      user: string;
      instanceType: string;
      cpu: number | string;
      mem: number | string;
      gpu: number | string;
    }>;
  };
}

interface SortableItem {
  name: string;
  type: string;
}

type Props = {
  getGroupUsages: {
    group: GroupProps;
  };
} & GroupContextComponentProps;

export const SubContent = styled.div`
  margin-bottom: 3em;

  .ant-table-thead > tr > th {
    border-bottom: 2px solid #aaaaaa;
    background: none;
  }
  .ant-table-tbody > tr.ant-table-row:hover > td {
    background: none;
  }
  .ant-table-tbody > tr:nth-child(odd) {
    background-color: #fafafa;
  }
  .ant-table-tbody > tr.total {
    background: none;
    font-weight: 600;
  }
  .ant-table-tbody > tr.total > td {
    border-bottom: none;
  }
`;

function DashboardTable({ group }: { group: GroupProps }) {
  const dataSource = [];
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) =>
        text && text.replaceAll('model_deploy', 'deployment'),
    },
    { title: 'User', dataIndex: 'user', key: 'user' },
    { title: 'Instance Type', dataIndex: 'instanceType', key: 'instanceType' },
    { title: 'CPU', dataIndex: 'cpu', key: 'cpu' },
    {
      title: 'Memory',
      dataIndex: 'mem',
      key: 'mem',
      render: (text: string) => `${text} GB`,
    },
    { title: 'GPU', dataIndex: 'gpu', key: 'gpu' },
  ];
  const typeOrder = ['notebook', 'job', 'model_deploy', 'app'];
  const sortBy = typeOrder.reduce((obj, item, index) => {
    return { ...obj, [item]: index };
  }, {});

  if (group && group.resourceStatus) {
    (group.resourceDetails?.details || [])
      .sort((a: SortableItem, b: SortableItem) =>
        a.type === b.type
          ? a.name.localeCompare(b.name)
          : sortBy[a.type] - sortBy[b.type]
      )
      .forEach(detail => {
        dataSource.push(detail);
      });
    const status = group.resourceStatus;
    dataSource.push({
      cpu: status.cpuUsage,
      mem: status.memUsage,
      gpu: status.gpuUsage,
    });
  }

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      size={'middle'}
      rowClassName={record => (record.name ? '' : 'total')}
    />
  );
}

function ResourceDashboard({ getGroupUsages }: Props) {
  const group = getGroupUsages.group;

  return (
    <>
      {group && (
        <>
          <ThinTitle level={2}>Resource Usage</ThinTitle>
          <SubContent>
            <DashboardTable group={group} />
          </SubContent>
        </>
      )}
    </>
  );
}

export default compose(
  withGroupContext,
  graphql(GroupUsages, {
    options: (props: Props) => {
      const { groupContext } = props;
      const where: { id: string } = { id: '' };
      if (groupContext) {
        where.id = groupContext.id;
      }

      return {
        variables: {
          where,
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getGroupUsages',
  })
)(ResourceDashboard);
