import * as React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Button, Table, Input, Icon } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import InfuseButton from 'components/infuseButton';
import { useRoutePrefix } from 'hooks/useRoutePrefix';

import { InstanceTypesLayout } from './Layout';
import { InstanceTypesQuery } from './instanceTypes.graphql';
import type { TInstanceType } from './types';

const styles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  margin: '16px',
  padding: '32px',
  backgroundColor: '#fff',
};

type InstanceTypeNode = {
  cursor: string;
  node: Pick<
    TInstanceType,
    | 'id'
    | 'name'
    | 'displayName'
    | 'description'
    | 'cpuLimit'
    | 'gpuLimit'
    | 'memoryLimit'
  >;
};

type InstanceTypeEdges = {
  edges: InstanceTypeNode[];
  pageInfo: {
    currentPage: number;
    totalPage: number;
  };
};

type QueryVariables = {
  page: number;
  where?: {
    name_contains: string;
  };
};

interface Props {
  data: {
    refetch: (variables: QueryVariables) => Promise<void>;
    error: Error | undefined;
    loading: boolean;
    variables: QueryVariables;
    instanceTypesConnection?: InstanceTypeEdges;
    fetchMore: ({
      variables,
      updateQuery,
    }: {
      variables: QueryVariables;
      updateQuery: (
        previousResult: InstanceTypeEdges,
        { fetchMoreResult: InstanceTypeEdges }
      ) => void;
    }) => void;
  };
}

export function _InstanceTypes({ data }: Props) {
  const [keyword, setKeyword] = React.useState('');

  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  const columns: ColumnProps<InstanceTypeNode>[] = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'node.name',
    },
    {
      key: 'display-name',
      title: 'Display Name',
      dataIndex: 'node.displayName',
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'node.description',
    },
    {
      key: 'cpu-limit',
      title: 'CPU Limit',
      dataIndex: 'node.cpuLimit',
    },
    {
      key: 'gpu-limit',
      title: 'GPU Limit',
      dataIndex: 'node.gpuLimit',
    },
    {
      key: 'memory-limit',
      title: 'Memory Limit',
      dataIndex: 'node.memoryLimit',
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '200px',
      render: function RenderActions(instance: InstanceTypeNode) {
        return (
          <Button.Group>
            <Button>
              <Link to={`${appPrefix}admin/instanceType/${instance.node.id}`}>
                <Icon type="edit" />
              </Link>
            </Button>
            <Button onClick={() => ({})}>
              <Icon type="delete" />
            </Button>
          </Button.Group>
        );
      },
    },
  ];

  function onSearch() {
    const { refetch, variables } = data;

    refetch({
      ...variables,
      page: 1,
      where: {
        ...variables.where,
        name_contains: keyword,
      },
    });
  }

  return (
    <InstanceTypesLayout>
      <div style={styles}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {/* @ts-ignore */}
            <Button
              type="primary"
              icon="plus"
              onClick={() =>
                history.push(`${appPrefix}admin/instanceType?operator=create`)
              }
            >
              Create Instance
            </Button>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <Input.Search
              placeholder="Search by display name"
              style={{ width: 295 }}
              value={keyword}
              onChange={(event) => setKeyword(event.currentTarget.value)}
              onSearch={onSearch}
            />
            <InfuseButton disabled={data.loading} onClick={onSearch}>
              Search
            </InfuseButton>
            <InfuseButton
              disabled={data.loading}
              onClick={() => {
                const { refetch } = data;

                setKeyword('');
                refetch({
                  page: 1,
                  where: null,
                });
              }}
            >
              Reset
            </InfuseButton>
          </div>
        </div>

        <Table
          rowKey={(data) => data.node.id}
          style={{ paddingTop: 8 }}
          columns={columns}
          loading={data.loading}
          dataSource={data?.instanceTypesConnection?.edges}
          pagination={{
            current: data?.instanceTypesConnection?.pageInfo.currentPage,
            total: data?.instanceTypesConnection?.pageInfo.totalPage * 10,

            onChange: (page) => {
              data.fetchMore({
                variables: {
                  page,
                },
                updateQuery: (previousResult, { fetchMoreResult }) => {
                  if (!fetchMoreResult) {
                    return previousResult;
                  }

                  return fetchMoreResult;
                },
              });
            },
          }}
        />
      </div>
    </InstanceTypesLayout>
  );
}

export const InstanceTypes = compose(
  graphql(InstanceTypesQuery, {
    options: () => {
      return {
        variables: {
          page: 1,
        },
        fetchPolicy: 'cache-and-network',
      };
    },
  })
)(_InstanceTypes);
