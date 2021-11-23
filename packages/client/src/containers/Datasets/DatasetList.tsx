import * as React from 'react';
import moment from 'moment';
import {
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
      // TODO: add doc link
      tipsLink: '',
    },
  ];

  return <PageTitle breadcrumb={<Breadcrumbs pathList={breadcrumbs} />} />;
}

function _DatasetList({
  datasets,
  createDataset,
  deleteDataset,
}: Props) {
  const groupContext = React.useContext(GroupContext);
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();
  const [keyword, setKeyword] = React.useState('');
  const [modalVisible, setModalVisible] = React.useState(false);

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
        {record.tags?.map((tag, index) => (
          <Tag key={index}>{tag}</Tag>
        ))}
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
      dataIndex: 'name',
      key: 'name',
      // TODO: implement sorter
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

