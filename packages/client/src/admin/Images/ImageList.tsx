import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Table, Input, Modal, Icon, Tooltip, notification } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import InfuseButton from 'components/infuseButton';
import { TruncateTableField } from 'utils/TruncateTableField';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { errorHandler } from 'utils/errorHandler';

import { ImagesLayout } from './Layout';
import { ImagesQuery, DeleteImageMutation } from './images.graphql';
import type { Image } from './types';

const styles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  margin: '16px',
  padding: '32px',
  backgroundColor: '#fff',
};

interface QueryVariables {
  page: number;
  where?: {
    search: string;
  };
  orderBy?: {
    [key: string]: 'asc' | 'desc';
  };
}

interface ImageNode {
  cursor: string;
  node: Pick<
    Image,
    'id' | 'name' | 'displayName' | 'description' | 'type' | 'isReady'
  >;
}

interface ImageConnection {
  edges: ImageNode[];
  pageInfo: {
    currentPage: number;
    totalPage: number;
  };
}

interface ImageListProps {
  data: {
    refetch: (variables?: QueryVariables) => Promise<void>;
    error: Error | undefined;
    loading: boolean;
    variables: QueryVariables;
    imagesConnection?: ImageConnection;
    fetchMore: ({
      variables,
      updateQuery,
    }: {
      variables: QueryVariables;
      updateQuery: (
        previousResult: ImageConnection,
        { fetchMoreResult: ImageConnection }
      ) => void;
    }) => void;
  };

  deleteImageMutation: ({
    variables,
  }: {
    variables: {
      where: {
        id: string;
      };
    };
  }) => Promise<void>;
}

function _ImageList({ data, ...props }: ImageListProps) {
  const [keyword, setKeyword] = React.useState('');
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  const columns: ColumnProps<ImageNode>[] = [
    {
      key: 'name',
      title: 'Name',
      sorter: true,
      width: '20%',
      render: (image: ImageNode) => (
        <TruncateTableField text={image?.node?.name}>
          <>
            {image.node.name}{' '}
            {!image.node.isReady && (
              <Icon type='warning' title='Image is not ready.' />
            )}
          </>
        </TruncateTableField>
      ),
    },
    {
      key: 'displayName',
      title: 'Display Name',
      dataIndex: 'node.displayName',
      sorter: true,
      width: '20%',
      render: text => <TruncateTableField text={text} defaultCharacter='-' />,
    },
    {
      key: 'type',
      title: 'Type',
      sorter: true,
      width: '20%',
      render: (image: ImageNode) => {
        if (image.node.type === 'both') {
          return 'Universal';
        }

        return image.node.type.toUpperCase();
      },
    },
    {
      key: 'description',
      title: 'Description',
      sorter: true,
      dataIndex: 'node.description',
      width: '20%',
      render: text => <TruncateTableField text={text} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '100px',
      render: function RenderActions(image: ImageNode) {
        return (
          <Button.Group>
            <Tooltip placement='bottom' title='Edit'>
              <Button
                data-testid='edit-button'
                icon='edit'
                onClick={() => {
                  history.push(`${appPrefix}admin/image/${image.node.id}`);
                }}
              />
            </Tooltip>
            <Tooltip placement='bottom' title='Delete'>
              <Button
                data-testid='delete-button'
                icon='delete'
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete Image',
                    content: (
                      <>
                        Are you sure to delete <strong>{image.node.id}</strong>?
                      </>
                    ),
                    okText: 'Yes',
                    maskClosable: true,
                    onOk: async () => {
                      try {
                        await props.deleteImageMutation({
                          variables: {
                            where: {
                              id: image.node.id,
                            },
                          },
                        });
                        await data.refetch();

                        notification.success({
                          duration: 5,
                          placement: 'bottomRight',
                          message: 'Successfully!',
                          description: `${image.node.displayName} has been deleted!`,
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
        search: keyword,
      },
    });
  }

  return (
    <ImagesLayout>
      <div style={styles}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {/* @ts-ignore */}
            <Button
              data-testid='add-button'
              type='primary'
              icon='plus'
              onClick={() => history.push(`${appPrefix}admin/image/add`)}
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
            <InfuseButton onClick={onSearch} data-testid='search-button'>
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
          dataSource={data?.imagesConnection?.edges}
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
            current: data?.imagesConnection?.pageInfo.currentPage,
            total: data?.imagesConnection?.pageInfo.totalPage * 10,

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
    </ImagesLayout>
  );
}

export const ImageList = compose(
  graphql(ImagesQuery, {
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
  graphql(DeleteImageMutation, {
    name: 'deleteImageMutation',
  })
)(_ImageList);
