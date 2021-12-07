import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Table, Modal, notification, Tooltip, Col } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import { TruncateTableField } from 'utils/TruncateTableField';
import { useRoutePrefix } from 'hooks/useRoutePrefix';

import {
  GetVolumes,
  CreateVolumeMutation,
  DeleteVolumeMutation,
} from 'queries/Volumes.graphql';
import { VolumeLayout } from './Layout';
import { VolumeForm } from './VolumeForm';
import type { TVolume, TVolumeForm } from './types';
import { errorHandler } from 'utils/errorHandler';
import InfuseButton from 'components/infuseButton';
import { FilterRow, FilterPlugins, ButtonCol } from 'cms-toolbar/filter';
import Search from 'antd/lib/input/Search';

const styles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  margin: '16px',
  padding: '32px',
  backgroundColor: '#fff',
};

type VolumeNode = {
  cursor: string;
  node: Pick<TVolume, 'id' | 'name' | 'displayName'>;
};

interface Props {
  volumeQuery: {
    refetch: (variables?: any) => Promise<void>;
    error: Error | undefined;
    loading: boolean;
    variables: any;
    volumesConnection?: {
      edges: VolumeNode[];
      pageInfo: {
        currentPage: number;
        totalPage: number;
      };
    };
  };
  createVolumeMutation: ({
    variables,
  }: {
    variables: {
      payload: Partial<TVolumeForm>;
    };
  }) => Promise<{ data: { createVolume: { id: string } } }>;
  deleteVolumeMutation: ({
    variables,
  }: {
    variables: {
      where: {
        id: string;
      };
    };
  }) => Promise<void>;
}

function _Volumes({
  volumeQuery,
  createVolumeMutation,
  deleteVolumeMutation,
}: Props) {
  const { appPrefix } = useRoutePrefix();
  const history = useHistory();
  const location = useLocation();
  const querystring = new URLSearchParams(location.search);

  useEffect(() => {
    if (volumeQuery.error) {
      errorHandler(volumeQuery.error);
    }
  }, [volumeQuery.error]);

  if (volumeQuery.error) {
    if (!volumeQuery?.volumesConnection) {
      return <div>Failure to load volumes.</div>;
    }
  }

  function handleSearch(searchString) {
    const variables = {
      ...volumeQuery.variables,
      page: 1,
      where: {
        search: searchString,
      },
    };
    volumeQuery.refetch(variables);
  }

  function handleAdd() {
    history.push(`${appPrefix}admin/volume?operator=create`);
  }

  function handleTableChange(pagination, filters, sorter) {
    const variables = {
      ...volumeQuery.variables,
      page: pagination.current,
      orderBy: !sorter.columnKey
        ? {}
        : {
            [sorter.columnKey]: sorter.order === 'ascend' ? 'asc' : 'desc',
          },
    };
    volumeQuery.refetch(variables);
  }

  async function handleSubmit(data) {
    try {
      const {
        data: {
          createVolume: { id },
        },
      } = await createVolumeMutation({
        variables: {
          payload: data,
        },
      });
      history.push(`${appPrefix}admin/volume`);

      await volumeQuery.refetch();
      notification.success({
        duration: 5,
        placement: 'bottomRight',
        message: 'Save successfully!',
        description: (
          <>
            Your changes have been saved. Click{' '}
            <span
              style={{ color: '#365abd', cursor: 'pointer' }}
              onClick={() => history.push(`${appPrefix}admin/volume/${id}`)}
            >
              here
            </span>{' '}
            to edit.
          </>
        ),
      });
    } catch (err) {
      errorHandler(err);
    }
  }

  if (querystring && querystring.get('operator') === 'create') {
    return (
      <VolumeLayout page='create'>
        <div style={styles}>
          <VolumeForm onSubmit={handleSubmit} />
        </div>
      </VolumeLayout>
    );
  }

  const { loading, volumesConnection = {} } = volumeQuery;

  const { edges = [], pageInfo = {} } = volumesConnection;

  const { currentPage, totalPage } = pageInfo;

  const columns: Array<ColumnProps<VolumeNode>> = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'node.name',
      sorter: true,
      render: text => <TruncateTableField text={text} />,
    },
    {
      key: 'displayName',
      title: 'Display Name',
      dataIndex: 'node.displayName',
      sorter: true,
      render: text => <TruncateTableField text={text} />,
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'node.description',
      sorter: true,
      render: text => <TruncateTableField text={text} />,
    },
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'node.type',
      sorter: true,
      render: text => {
        const volumeType = {
          pv: 'Persistent Volume',
          nfs: 'NFS',
          hostPath: 'Host Path',
          git: 'Git Sync',
          env: 'Env',
        };

        if (volumeType[text]) {
          return volumeType[text];
        }

        return '';
      },
    },
    {
      key: 'uploadServerLink',
      title: 'Upload Server',
      dataIndex: 'node.uploadServerLink',
      sorter: true,
      render: text => {
        if (text) {
          return (
            <a href={text} target='_blank' rel='noreferrer'>
              Link
            </a>
          );
        }
        return '-';
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '100px',
      render: function RenderActions(volume: VolumeNode) {
        return (
          <Button.Group>
            <Tooltip placement='bottom' title='Edit'>
              <Button
                data-testid='edit-button'
                icon='edit'
                onClick={() => {
                  history.push(`${appPrefix}admin/volume/${volume.node.id}`);
                }}
              />
            </Tooltip>
            <Tooltip placement='bottom' title='Delete'>
              <Button
                data-testid='delete-button'
                icon='delete'
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete Volume',
                    maskClosable: true,
                    content: (
                      <>
                        Are you sure to delete{' '}
                        <strong>{volume.node.displayName}</strong> volume?
                      </>
                    ),
                    okText: 'Yes',
                    onOk: async () => {
                      await deleteVolumeMutation({
                        variables: {
                          where: {
                            id: volume.node.id,
                          },
                        },
                      });
                      await volumeQuery.refetch();
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

  return (
    <>
      <VolumeLayout page='list'>
        <div data-testid='volume' style={styles}>
          <FilterRow align='bottom' style={{ marginBottom: 16, marginTop: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
              }}
            >
              <InfuseButton
                data-testid='add-button'
                icon='plus'
                onClick={handleAdd}
                style={{ marginRight: 16, width: 120 }}
                type='primary'
              >
                Add
              </InfuseButton>
            </div>
            <ButtonCol>
              <Col>
                <FilterPlugins style={{ marginRight: '10px' }}>
                  <Search
                    data-testid='text-filter'
                    placeholder={`Search Volume`}
                    onSearch={handleSearch}
                  />
                </FilterPlugins>
              </Col>
            </ButtonCol>
          </FilterRow>
          <Table
            rowKey={data => data.node.id}
            style={{ paddingTop: 8 }}
            columns={columns}
            loading={loading}
            pagination={{
              current: currentPage,
              total: totalPage * 10,
            }}
            onChange={handleTableChange}
            dataSource={edges}
          />
        </div>
      </VolumeLayout>
    </>
  );
}

export const Volumes = compose(
  graphql(GetVolumes, {
    name: 'volumeQuery',
    options: () => {
      return {
        fetchPolicy: 'cache-and-network',
        variables: {
          page: 1,
          orderBy: {},
          where: {},
        },
      };
    },
  }),
  graphql(CreateVolumeMutation, {
    name: 'createVolumeMutation',
  }),
  graphql(DeleteVolumeMutation, {
    name: 'deleteVolumeMutation',
  })
)(_Volumes);
