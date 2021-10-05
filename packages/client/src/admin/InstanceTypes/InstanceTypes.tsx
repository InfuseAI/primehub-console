import * as React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Button,
  Table,
  Input,
  Modal,
  Tooltip,
  Typography,
  notification,
} from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { omit } from 'lodash';

import InfuseButton from 'components/infuseButton';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { errorHandler } from 'utils/errorHandler';

import { InstanceTypesLayout } from './Layout';
import { InstanceTypeForm, InstanceTypeFormState } from './InstanceTypeForm';
import {
  InstanceTypesQuery,
  CreateInstanceTypeMutation,
  DeleteInstanceTypeMutation,
} from './instanceTypes.graphql';
import type { TInstanceType } from './types';

function RenderFieldName(text: string) {
  if (text?.length > 35) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          maxWidth: '250px',
        }}
      >
        <Tooltip placement='top' title={text}>
          <Typography.Paragraph
            ellipsis={{ rows: 3 }}
            style={{ marginBottom: 0 }}
          >
            {text}
          </Typography.Paragraph>
        </Tooltip>
      </div>
    );
  }

  return text;
}

const styles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  margin: '16px',
  padding: '32px',
  backgroundColor: '#fff',
};

interface InstanceTypeNode {
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
}

interface InstanceTypeConnection {
  edges: InstanceTypeNode[];
  pageInfo: {
    currentPage: number;
    totalPage: number;
  };
}

interface QueryVariables {
  page: number;
  where?: {
    name_contains: string;
  };
  orderBy?: {
    [key: string]: 'asc' | 'desc';
  };
}

interface Props {
  data: {
    refetch: (variables?: QueryVariables) => Promise<void>;
    error: Error | undefined;
    loading: boolean;
    variables: QueryVariables;
    instanceTypesConnection?: InstanceTypeConnection;
    fetchMore: ({
      variables,
      updateQuery,
    }: {
      variables: QueryVariables;
      updateQuery: (
        previousResult: InstanceTypeConnection,
        { fetchMoreResult: InstanceTypeConnection }
      ) => void;
    }) => void;
  };

  createInstanceTypeMutation: ({
    variables,
  }: {
    variables: {
      payload: InstanceTypeFormState;
    };
  }) => Promise<{ data: { createInstanceType: { id: string } } }>;

  deleteInstanceTypeMutation: ({
    variables,
  }: {
    variables: {
      where: {
        id: string;
      };
    };
  }) => Promise<void>;
}

export function _InstanceTypes({
  data,
  createInstanceTypeMutation,
  deleteInstanceTypeMutation,
}: Props) {
  const [keyword, setKeyword] = React.useState('');

  const history = useHistory();
  const location = useLocation();
  const querystring = new URLSearchParams(location.search);
  const { appPrefix } = useRoutePrefix();

  const columns: ColumnProps<InstanceTypeNode>[] = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'node.name',
      sorter: true,
      width: '300px',
      render: RenderFieldName,
    },
    {
      key: 'displayName',
      title: 'Display Name',
      dataIndex: 'node.displayName',
      sorter: true,
      width: '300px',
      render: RenderFieldName,
    },
    {
      key: 'description',
      title: 'Description',
      sorter: true,
      render: (instance: InstanceTypeNode) => {
        return instance.node.description || '-';
      },
    },
    {
      key: 'cpuLimit',
      title: 'CPU Limit',
      dataIndex: 'node.cpuLimit',
      sorter: true,
    },
    {
      key: 'gpuLimit',
      title: 'GPU Limit',
      dataIndex: 'node.gpuLimit',
      sorter: true,
    },
    {
      key: 'memoryLimit',
      title: 'Memory Limit',
      dataIndex: 'node.memoryLimit',
      sorter: true,
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '200px',
      render: function RenderActions(instance: InstanceTypeNode) {
        return (
          <Button.Group>
            <Tooltip placement='bottom' title='Edit'>
              <Button
                data-testid='edit-button'
                icon='edit'
                onClick={() => {
                  history.push(
                    `${appPrefix}admin/instanceType/${instance.node.id}`
                  );
                }}
              />
            </Tooltip>
            <Tooltip placement='bottom' title='Delete'>
              <Button
                data-testid='delete-button'
                icon='delete'
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete Instance',
                    content: (
                      <>
                        Are you sure to delete{' '}
                        <strong>{instance.node.id}</strong>?
                      </>
                    ),
                    okText: 'Yes',
                    maskClosable: true,
                    onOk: async () => {
                      try {
                        await deleteInstanceTypeMutation({
                          variables: {
                            where: {
                              id: instance.node.id,
                            },
                          },
                        });
                        await data.refetch();

                        notification.success({
                          duration: 5,
                          placement: 'bottomRight',
                          message: 'Delete successfully!',
                        });
                      } catch (err) {
                        console.error(err);
                        errorHandler(err);
                      }
                    },
                  });
                }}
              />
            </Tooltip>
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

  async function onSubmit(
    formData: InstanceTypeFormState & { nodeList?: string[][] }
  ) {
    const { tolerations, ...rest } = formData;

    const nextTolerations =
      tolerations.length === 0
        ? []
        : tolerations.map(toleration => omit(toleration, ['id', '__typename']));

    // if have `nodeList`, transform `nodeList` to `{ key, value }` format
    let nextNodeSelector: Record<string, string> = {};
    if (formData?.nodeList) {
      nextNodeSelector = formData.nodeList.reduce((acc, v) => {
        const key = v[0];
        const value = v[1];

        acc[key] = value;

        return acc;
      }, {});
    }

    try {
      let fields = omit(rest, [
        'id', // `id` just be used in the frontend
        'nodeList', // omit tempoary field
        'tolerations', // using `nextTolerations` to replace tolerations field
        'groups.disconnect', // when creating instance type, groups' s field `disconnect` is not allowed
      ]);

      if (!rest.cpuRequest) {
        // when creating instance type, if cpuRequest is `null` not allowed
        fields = omit(fields, ['cpuRequest']);
      }

      if (!rest.memoryRequest) {
        // when creating instance type, if memoryRequest is `null` not allowed
        fields = omit(fields, ['memoryRequest']);
      }

      const {
        data: { createInstanceType },
      } = await createInstanceTypeMutation({
        variables: {
          payload: {
            ...fields,
            tolerations: {
              // @ts-ignore Due to API have a `set` field
              set: nextTolerations,
            },
            nodeSelector: nextNodeSelector,
          },
        },
      });

      history.push(`${appPrefix}admin/instanceType`);

      await data.refetch();
      notification.success({
        duration: 5,
        placement: 'bottomRight',
        message: 'Save successfully!',
        description: (
          <>
            Your changes have been saved. Click{' '}
            <span
              style={{ color: '#365abd', cursor: 'pointer' }}
              onClick={() =>
                history.push(
                  `${appPrefix}admin/instanceType/${createInstanceType.id}`
                )
              }
            >
              here
            </span>{' '}
            to edit.
          </>
        ),
      });
    } catch (err) {
      console.error(err);
      notification.error({
        duration: 5,
        placement: 'bottomRight',
        message: 'Failure!',
        description:
          'Please try again later and check resources already exist or not.',
      });
    }
  }

  if (data.error) {
    return <div>Failure to load instances.</div>;
  }

  if (querystring && querystring.get('operator') === 'create') {
    return (
      <InstanceTypesLayout>
        <div style={styles}>
          <InstanceTypeForm disableName={false} onSubmit={onSubmit} />
        </div>
      </InstanceTypesLayout>
    );
  }

  return (
    <InstanceTypesLayout>
      <div style={styles}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {/* @ts-ignore */}
            <Button
              data-testid='add-button'
              type='primary'
              icon='plus'
              onClick={() =>
                history.push(`${appPrefix}admin/instanceType?operator=create`)
              }
            >
              Add
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
              data-testid='text-filter'
              placeholder='Search by name'
              style={{ width: 295 }}
              value={keyword}
              onChange={event => setKeyword(event.currentTarget.value)}
              onSearch={onSearch}
            />
            <InfuseButton
              data-testid='search-button'
              disabled={data.loading}
              onClick={onSearch}
            >
              Search
            </InfuseButton>
            <InfuseButton
              data-testid='reset-button'
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
          rowKey={data => data.node.id}
          style={{ paddingTop: 8 }}
          columns={columns}
          loading={data.loading}
          dataSource={data?.instanceTypesConnection?.edges}
          onChange={(pagination, filters, sorter) => {
            const { refetch, variables } = data;

            if (sorter?.columnKey) {
              const { columnKey, order } = sorter;
              const sortType = {
                ascend: 'asc',
                descend: 'desc',
              } as const;

              refetch({
                ...variables,
                page: pagination.current,
                orderBy: {
                  [columnKey]: sortType[order],
                },
              });
            } else {
              refetch({
                ...variables,
                page: pagination.current,
                orderBy: null,
              });
            }
          }}
          pagination={{
            current: data?.instanceTypesConnection?.pageInfo.currentPage,
            total: data?.instanceTypesConnection?.pageInfo.totalPage * 10,

            onChange: page => {
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
        onError: errorHandler,
      };
    },
  }),
  graphql(CreateInstanceTypeMutation, {
    name: 'createInstanceTypeMutation',
  }),
  graphql(DeleteInstanceTypeMutation, {
    name: 'deleteInstanceTypeMutation',
  })
)(_InstanceTypes);
