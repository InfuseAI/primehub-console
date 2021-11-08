import * as React from 'react';
import moment from 'moment';
import { notification, Table, Tag, Input, Alert, Pagination } from 'antd';
import type { ColumnProps } from 'antd/lib/table';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { Link, withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { TruncateTableField } from 'utils/TruncateTableField';

import {
  GroupContext,
  GroupContextComponentProps,
  withGroupContext,
} from 'context/group';
import { errorHandler } from 'utils/errorHandler';

import { Dataset, DatasetConnection } from 'components/datasets/common';
import { DatasetCreateForm } from 'components/datasets/createForm';
import { GetDatasets, CreateDatasetMutation } from './dataset.graphql';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const Search = Input.Search;

interface QueryVariables {
  where: {
    groupName: string;
    search?: string;
  };
  page?: number;
}

interface InputVariables {
  id: string;
  name: string;
  groupName: string;
  tags: string[];
}

type Props = {
  groups: Array<{
    id: string;
  }>;
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
} & RouteComponentProps &
  GroupContextComponentProps;

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

function List({ groups, datasets, createDataset }: Props) {
  const groupContext = React.useContext(GroupContext);
  const [keyword, setKeyword] = React.useState('');
  const [modalVisible, setModalVisible] = React.useState(false);

  async function onSubmit(data) {
    const { refetch, variables } = datasets;

    console.log(data);
    await createDataset({
      variables: {
        payload: {
          ...data,
          groupName: groupContext.name,
        },
      },
    });

    refetch({
      where: variables.where,
      page: variables.page,
    });

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

  function renderTags(text, record) {
    return (
      <>
        {record.tags?.map((tag, index) => (
          <Tag key={index}>{tag}</Tag>
        ))}
      </>
    );
  }

  if (groupContext) {
    const group = groups.find(group => group.id === groupContext.id);

    if (!group) {
      return (
        <>
          <CommonPageTitle />
          <PageBody>
            <Alert
              message='Group not found'
              description={`Group ${groupContext.name} is not found or not authorized.`}
              type='error'
              showIcon
            />
          </PageBody>
        </>
      );
    }
  }

  if (datasets.error) {
    return <div>Failure to load datasets.</div>;
  }
  if (!datasets.datasetV2Connection) {
    return <></>;
  }

  const columns: Array<ColumnProps<Dataset>> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      // TODO: implement sorter
      sorter: true,
      render: (text, record) => (
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
      ),
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
      // TODO: add action item
      render: () => <></>,
    },
  ];

  const connection = datasets.datasetV2Connection;

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
            icon='plus'
            type='primary'
            onClick={() => {
              console.log('create');
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
            dataSource={connection.edges.map(edge => edge.node)}
            columns={columns}
            rowKey='id'
            pagination={false}
          />
          <DatasetCreateForm
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
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
            total={connection.pageInfo?.totalPage * DEFAULT_PAGE_SIZE}
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
        const name = data.createDatasetV2.name;
        notification.success({
          message: `Dataset '${name}' has been created.`,
          duration: 5,
          placement: 'bottomRight',
        });
      },
      onError: errorHandler,
    },
    name: 'createDataset',
  })
)(List);
