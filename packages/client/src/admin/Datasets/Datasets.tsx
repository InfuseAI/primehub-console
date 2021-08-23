import * as React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Table, Modal, notification, Skeleton, Col } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import { useRoutePrefix } from 'hooks/useRoutePrefix';

import {
  GetDatasets,
  CreateDatasetMutation,
  DeleteDatasetMutation,
} from 'queries/Datasets.graphql';
import { DatasetLayout } from './Layout';
import { DatasetForm } from './DatasetForm';
import type { TDataset, TDatasetForm } from './types';
import { errorHandler } from 'utils/errorHandler';
import InfuseButton from 'components/infuseButton';
import { FilterRow, FilterPlugins, ButtonCol } from 'cms-toolbar/filter';
import Search from 'antd/lib/input/Search';
import { useEffect, useState } from 'react';

const styles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  margin: '16px',
  padding: '32px',
  backgroundColor: '#fff',
};

type DatasetNode = {
  cursor: string;
  node: Pick<TDataset, 'id' | 'name' | 'displayName'>;
};

interface Props {
  datasetQuery: {
    refetch: (variables: any) => Promise<void>;
    error: Error | undefined;
    loading: boolean;
    variables: any;
    datasetsConnection?: {
      edges: DatasetNode[];
      pageInfo: {
        currentPage: number;
        totalPage: number;
      }
    };
  };
  createDatasetMutation: ({
    variables,
  }: {
    variables: {
      payload: Partial<TDatasetForm>;
    };
  }) => Promise<{ data: { createDataset: { id: string } } }>;
  deleteDatasetMutation: ({
    variables,
  }: {
    variables: {
      where: {
        id: string;
      };
    };
  }) => Promise<void>;
}

interface QueryVariables {
  page: number;
  orderBy?: {};
  where?: {
    displayName_contains?: string;
  };
}

function _Datasets({
  datasetQuery,
  createDatasetMutation,
  deleteDatasetMutation,
}: Props) {
  const { appPrefix } = useRoutePrefix();
  const history = useHistory();
  const location = useLocation();
  const querystring = new URLSearchParams(location.search);

  useEffect(() => {
    if (datasetQuery.error) {
      errorHandler(datasetQuery.error);
    }
  }, [datasetQuery.error]);

  if (datasetQuery.error) {
    if (!datasetQuery?.datasetsConnection) {
      return <div>Failure to load datasets.</div>;
    }
  }

  async function handleSearch(searchString) {
    const variables = {
      ...datasetQuery.variables,
      page: 1,
      where: {
        displayName_contains: searchString,
      },
    };
    datasetQuery.refetch(variables);
  }

  async function handleAdd() {
    history.push(`${appPrefix}admin/dataset?operator=create`);
  }

  async function handleTableChange(pagination, filters, sorter) {
    const variables = {
      ...datasetQuery.variables,
      page: pagination.current,
      orderBy: !sorter.columnKey
        ? {}
        : {
        [sorter.columnKey]: sorter.order === 'ascend' ? 'asc' : 'desc',
      },
    };
    datasetQuery.refetch(variables);
  }

  async function handleSubmit(data) {
    try {
      const {
        data: {
          createDataset: { id },
        },
      } = await createDatasetMutation({
        variables: {
          payload: data,
        },
      });
      history.push(`${appPrefix}admin/dataset`);

      await datasetQuery.refetch();
      notification.success({
        duration: 5,
        placement: 'bottomRight',
        message: 'Save successfully!',
        description: (
          <>
            Your changes have been saved. Click{' '}
            <span
              style={{ color: '#365abd', cursor: 'pointer' }}
              onClick={() => history.push(`${appPrefix}admin/dataset/${id}`)}
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
      <DatasetLayout page="create">
        <div style={styles}>
          <DatasetForm onSubmit={handleSubmit} />
        </div>
      </DatasetLayout>
    );
  }

  if (datasetQuery.loading && !datasetQuery?.datasetsConnection) {
    return <Skeleton />;
  }

  const {
    loading,
    datasetsConnection: {
      edges,
      pageInfo: { currentPage, totalPage },
    },
  } = datasetQuery;

  const columns: ColumnProps<DatasetNode>[] = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'node.name',
      sorter: true,
    },
    {
      key: 'displayName',
      title: 'Display Name',
      dataIndex: 'node.displayName',
      sorter: true,
      render: (text) => text || '-',
    },
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'node.type',
      sorter: true,
      render: (text) => {
        const datasetType = {
          pv: 'Persistent Volume',
          nfs: 'NFS',
          hostPath: 'Host Path',
          git: 'Git',
          env: 'Env',
        };

        if (datasetType[text]) {
          return datasetType[text];
        }

        return '';
      },
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'node.description',
      sorter: true,
      render: (text) => text || '-',
    },
    {
      key: 'uploadServerLink',
      title: 'Upload Server',
      dataIndex: 'node.uploadServerLink',
      sorter: true,
      render: (text) => {
        if (text) {
          return (
            <a href={text} target="_blank">
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
      width: '200px',
      render: function RenderActions(dataset: DatasetNode) {
        return (
          <Button.Group>
            <Button
              data-testid='edit-button'
              icon="edit"
              onClick={() => {
                history.push(`${appPrefix}admin/dataset/${dataset.node.id}`);
              }}
            />
            <Button
              data-testid='delete-button'
              icon="delete"
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Dataset',
                  content: (
                    <>
                      Are you sure to delete{' '}
                      <strong>{dataset.node.displayName}</strong> dataset?
                    </>
                  ),
                  okText: 'Yes',
                  onOk: async () => {
                    await deleteDatasetMutation({
                      variables: {
                        where: {
                          id: dataset.node.id,
                        },
                      },
                    });
                    await datasetQuery.refetch();
                  },
                });
              }}
            />
          </Button.Group>
        );
      },
    },
  ];

  return (
    <>
      <DatasetLayout page="list">
        <div data-testid='dataset' style={styles}>
          <FilterRow align="bottom" style={{marginBottom: 16, marginTop: 16}}>
            <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
              <InfuseButton
                data-testid='add-button'
                icon="plus"
                onClick={handleAdd}
                style={{marginRight: 16, width: 120}}
                type="primary"
              >
                Add
              </InfuseButton>
            </div>
            <ButtonCol>
              <Col>
                <FilterPlugins style={{marginRight: '10px'}}>
                  <Search
                    data-testid='text-filter'
                    placeholder={`Search Dataset`}
                    onSearch={handleSearch}
                  />
                </FilterPlugins>
              </Col>
            </ButtonCol>
          </FilterRow>
          <Table
            rowKey={(data) => data.node.id}
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
      </DatasetLayout>
    </>
  );
}

export const Datasets = compose(
  graphql(GetDatasets, {
    name: 'datasetQuery',
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
  graphql(CreateDatasetMutation, {
    name: 'createDatasetMutation',
  }),
  graphql(DeleteDatasetMutation, {
    name: 'deleteDatasetMutation',
  })
)(_Datasets);
