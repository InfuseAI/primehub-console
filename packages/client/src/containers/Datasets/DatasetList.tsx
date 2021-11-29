import * as React from 'react';
import moment from 'moment';
import {
  Alert,
  Button,
  Input,
  Modal,
  Pagination,
  Table,
  Tag,
  Tooltip,
  notification,
} from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import {
  Link,
  withRouter,
  RouteComponentProps,
  useHistory,
} from 'react-router-dom';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import type { ColumnProps } from 'antd/lib/table';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { TruncateTableField } from 'utils/TruncateTableField';
import { errorHandler } from 'utils/errorHandler';

import {
  GroupContext,
  GroupContextComponentProps,
  withGroupContext,
} from 'context/group';

import {
  Dataset,
  DatasetConnection,
  InputVariables,
  QueryVariables,
} from 'components/datasets/common';
import DatasetCreateForm from 'components/datasets/CreateForm';
import {
  CreateDatasetMutation,
  DeleteDatasetMutation,
  GetDatasets,
} from './dataset.graphql';

const { confirm } = Modal;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const Search = Input.Search;

interface Props
  extends RouteComponentProps<{ datasetId: string }>,
    GroupContextComponentProps {
  datasets: {
    error?: Error | undefined;
    loading: boolean;
    variables: QueryVariables;
    refetch: (variables?: QueryVariables) => void;
    datasetV2Connection: DatasetConnection;
  };
  createDataset: ({
    variables,
  }: {
    variables: {
      payload: InputVariables;
    };
  }) => Promise<void>;
  deleteDataset: ({
    variables,
  }: {
    variables: {
      where: { id: string; groupName: string };
    };
  }) => Promise<void>;
}

function CommonPageTitle() {
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/datasets/,
      title: 'Datasets',
      link: '/datasets',
      tips: 'Users can manage datasets here.',
      tipsLink: 'https://docs.primehub.io/docs/datasets',
    },
  ];

  return <PageTitle breadcrumb={<Breadcrumbs pathList={breadcrumbs} />} />;
}

function _DatasetList({ datasets, createDataset, deleteDataset }: Props) {
  const groupContext = React.useContext(GroupContext);
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();
  const [keyword, setKeyword] = React.useState('');
  const [orderBy, setOrderBy] = React.useState({});
  const [modalVisible, setModalVisible] = React.useState(false);

  if (!window?.enablePhfs) {
    return (
      <>
        <CommonPageTitle />

        <PageBody>
          <div>
            <Alert
              showIcon
              message='Warning'
              description='PHFS is not enabled. Please tell your administrator to enable it.'
              type='warning'
            />
          </div>
        </PageBody>
      </>
    );
  }

  async function onSubmit(data: InputVariables) {
    try {
      await createDataset({
        variables: {
          payload: {
            ...data,
            groupName: groupContext.name,
          },
        },
      });
    } catch (e) {
      errorHandler(e);
      // throw it so that the model know something wrong.
      throw e;
    }
  }

  function onPageChanged(page) {
    const { refetch, variables } = datasets;

    refetch({
      where: variables.where,
      page,
      orderBy,
    });
  }

  function searchHandler(keyword: string) {
    const { refetch, variables } = datasets;

    refetch({
      where: {
        ...variables.where,
        search: keyword,
      },
      page: DEFAULT_PAGE,
      orderBy,
    });
  }

  function renderName(text, record) {
    return (
      <TruncateTableField text={text}>
        <Link
          to={{
            state: {
              prevPathname: location.pathname,
              prevSearch: location.search,
            },
            pathname: `datasets/${record.id}`,
          }}
        >
          {text}
        </Link>
      </TruncateTableField>
    );
  }

  function renderTags(text, record) {
    return (
      <>
        {record.tags?.map(tag => {
          const isLongTag = tag.length > 20;
          const tagElem = (
            <Tag key={tag}>{isLongTag ? `${tag.slice(0, 20)}...` : tag}</Tag>
          );
          return isLongTag ? (
            <Tooltip title={tag} key={tag}>
              {tagElem}
            </Tooltip>
          ) : (
            tagElem
          );
        })}
      </>
    );
  }

  function renderAction(record) {
    return (
      <Button.Group>
        <Tooltip placement='bottom' title='Delete'>
          <Button
            icon='delete'
            onClick={() => {
              confirm({
                title: `Delete`,
                content: (
                  <>
                    Are you sure you want to delete <b>{record.name}</b>?
                  </>
                ),
                iconType: 'info-circle',
                okText: 'Yes',
                cancelText: 'No',
                maskClosable: true,
                onOk: async () => {
                  try {
                    await deleteDataset({
                      variables: {
                        where: {
                          id: record.id,
                          groupName: groupContext.name,
                        },
                      },
                    });

                    notification.success({
                      message: (
                        <>
                          Dataset <b>{record.id}</b> has been deleted.
                        </>
                      ),
                      duration: 5,
                      placement: 'bottomRight',
                    });

                    const { refetch, variables } = datasets;
                    refetch({
                      where: variables.where,
                      page: variables.page,
                      orderBy,
                    });
                  } catch (err) {
                    errorHandler(err);
                  }
                },
              });
            }}
          />
        </Tooltip>
      </Button.Group>
    );
  }

  if (datasets.error) {
    return <div>Failure to load datasets.</div>;
  }

  const columns: Array<ColumnProps<Dataset>> = [
    {
      title: 'Name',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      render: renderName,
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      sorter: true,
    },
    {
      title: 'Last Modified',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: true,
      render: text => moment(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: renderTags,
    },
    {
      key: 'action',
      align: 'right',
      render: renderAction,
    },
  ];

  const connection = datasets.datasetV2Connection;
  const dataSource = connection ? connection.edges.map(edge => edge.node) : [];
  const total = connection?.pageInfo?.totalPage * DEFAULT_PAGE_SIZE;
  const current = connection?.pageInfo?.currentPage || DEFAULT_PAGE;

  return (
    <>
      <CommonPageTitle />

      <PageBody>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: '1rem',
          }}
        >
          <InfuseButton
            data-testid='add-button'
            icon='plus'
            type='primary'
            onClick={() => {
              setModalVisible(true);
            }}
          >
            New Dataset
          </InfuseButton>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <Search
            placeholder='Search by name'
            value={keyword}
            onChange={event => setKeyword(event.currentTarget.value)}
            onSearch={searchHandler}
          />
        </div>
        <div
          style={{
            paddingTop: '16px',
          }}
        >
          <Table
            loading={datasets.loading}
            dataSource={dataSource}
            columns={columns}
            rowKey='id'
            pagination={false}
            onChange={(pagination, filters, sorter) => {
              if (sorter?.order) {
                const order = {
                  [sorter.field]: sorter.order.replace(/end$/, ''),
                };
                setOrderBy(order);
                const { refetch, variables } = datasets;
                refetch({
                  where: variables.where,
                  page: variables.page,
                  orderBy: order,
                });
              }
            }}
          />
          <DatasetCreateForm
            visible={modalVisible}
            onClose={datasetId => {
              const { refetch } = datasets;

              setModalVisible(false);
              if (datasetId) {
                history.push(
                  `${appPrefix}g/${groupContext.name}/datasets/${datasetId}/`
                );
              } else {
                refetch();
              }
            }}
            onSubmit={onSubmit}
          />
        </div>
        <div
          style={{
            padding: '16px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Pagination
            current={current}
            total={total}
            onChange={onPageChanged}
          />
        </div>
      </PageBody>
    </>
  );
}

export const DatasetList = compose(
  withRouter,
  withGroupContext,
  graphql(GetDatasets, {
    options: ({ groupContext, location }: Props) => {
      const querystring = new URLSearchParams(location.search);
      const page = Number(querystring.get('page')) || DEFAULT_PAGE;

      return {
        variables: {
          page,
          where: {
            groupName: groupContext.name,
          },
        },
        onError: errorHandler,
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'datasets',
    skip: () => !window?.enablePhfs,
  }),
  graphql(CreateDatasetMutation, {
    options: {
      onCompleted: (data: any) => {
        const dataset = data.createDatasetV2;
        notification.success({
          message: (
            <>
              Dataset <b>{dataset.id}</b> has been created.
            </>
          ),
          duration: 5,
          placement: 'bottomRight',
        });
      },
    },
    name: 'createDataset',
  }),
  graphql(DeleteDatasetMutation, {
    name: 'deleteDataset',
  })
)(_DatasetList);
