import React, { useState, useEffect } from 'react';
import { Modal, Input, Col, Layout, Button, Tooltip } from 'antd';
import {
  withRouter,
  RouteComponentProps,
  useHistory,
  useLocation,
} from 'react-router-dom';
import { List } from './list';
import { reduce, get } from 'lodash';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import {
  GroupsConnection,
  GroupResourcesToBeDeleted,
  DeleteGroup,
} from 'queries/Group.graphql';
import queryString from 'querystring';
import { graphql, withApollo } from 'react-apollo';
import { compose } from 'recompose';
import InfuseButton from 'components/infuseButton';
import { FilterRow, FilterPlugins, ButtonCol } from 'components/share';
import { errorHandler } from 'utils/errorHandler';
import { TruncateTableField } from 'utils/TruncateTableField';
import ApolloClient from 'apollo-client';

const { confirm } = Modal;
const { Search } = Input;
const ButtonGroup = Button.Group;

type Props = {
  client: ApolloClient<any>;
  dataSource: any;
  loading?: boolean;
  listGroup?: any;
  deleteGroup?: any;
} & RouteComponentProps;

export function GroupList(props: Props) {
  const history = useHistory();
  const location = useLocation();
  const DISABLE_GROUP = (window as any).disableGroup || false;
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/group/,
      title: 'Groups',
      tips: 'Admin can find and manage groups here.',
      tipsLink: 'https://docs.primehub.io/docs/guide_manual/admin-group',
    },
  ];
  const params = queryString.parse(location.search.replace(/^\?/, '')) || {};
  const [currentPage, setCurrentPage] = useState(get(params, 'page', 1));
  const [search, setSearch] = useState(get(params, 's', null));
  const [orderBy, setOrderBy] = useState(get(params, 'orderBy', null));

  useEffect(() => {
    const paramsResult = [];
    if (search) {
      paramsResult.push(`s=${search}`);
    }
    if (orderBy) {
      paramsResult.push(`orderBy=${orderBy}`);
    }
    if (currentPage) {
      paramsResult.push(`page=${currentPage}`);
    }
    history.replace({
      search: `?${paramsResult.join('&')}`,
    });
  }, [currentPage, search, orderBy, history]);

  const add = () => {
    history.push('group/add');
  };
  const edit = id => {
    history.push(`group/${id}`);
  };
  const remove = async (id, record, client) => {
    const { deleteGroup } = props;
    const variables = { where: { id } };
    try {
      const result = await client.query({
        query: GroupResourcesToBeDeleted,
        fetchPolicy: 'no-cache',
        variables,
      });

      const resources = result.data?.groupResourcesToBeDeleted;
      const resourceCount = Object.values(resources)
        .filter(value => typeof value === 'number')
        .reduce((prev, curr) => prev + curr, 0);
      const messageForDeleted = resourceCount > 0 && (
        <>
          You'll permanently lose your:
          <ul style={{ marginBottom: 0 }}>
            {resources.jobs ? <li>{resources.jobs} Jobs</li> : <></>}
            {resources.schedules ? <li>{resources.schedules} Recurring Jobs</li> : <></>}
            {resources.deployments ? <li>{resources.deployments} Deployments</li> : <></>}
            {resources.apps ? <li>{resources.apps} Apps</li> : <></>}
          </ul>
        </>
      );

      confirm({
        title: `Do you really want to delete this group?`,
        content: (
          <span>
            All resources associated to this group will be deleted. {messageForDeleted}
          </span>
        ),
        iconType: 'info-circle',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        maskClosable: true,
        onOk() {
          return deleteGroup({ variables });
        },
      });
    } catch (err) {
      errorHandler(err);
    }
  };

  const renderAction = (id, record) => {
    const { client } = props;
    return (
      <ButtonGroup>
        <Tooltip placement='bottom' title='Edit'>
          <Button
            icon={'edit'}
            data-testid='edit-button'
            onClick={() => edit(record.id)}
          />
        </Tooltip>
        <Tooltip placement='bottom' title='Delete'>
          <Button
            icon='delete'
            data-testid='delete-button'
            disabled={DISABLE_GROUP === true}
            onClick={() => remove(id, record, client)}
          />
        </Tooltip>
      </ButtonGroup>
    );
  };

  let parsedOrderBy = {};
  try {
    parsedOrderBy = JSON.parse((orderBy as string) || '{}');
  } catch (e) {
    console.error(e);
  }
  const paginationData = {
    current: +currentPage,
  };
  const reducedOrderBy: {
    name?: string;
    displayName?: string;
    sharedVolumeCapacity?: string;
    quotaCpu?: string;
    quotaGpu?: string;
    projectQuotaCpu?: string;
    projectQuotaGpu?: string;
  } = reduce(
    parsedOrderBy,
    (result, value, key) => {
      result[key] = `${value}end`;
      return result;
    },
    {}
  );
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: reducedOrderBy.name,
      render: text => <TruncateTableField text={text} />,
    },
    {
      title: 'Display Name',
      dataIndex: 'displayName',
      sorter: true,
      sortOrder: reducedOrderBy.displayName,
      render: text => <TruncateTableField text={text} />,
    },
    {
      title: 'Share Volume Capacity',
      dataIndex: 'sharedVolumeCapacity',
      sorter: true,
      sortOrder: reducedOrderBy.sharedVolumeCapacity,
      visible: !modelDeploymentOnly,
      render: value => {
        if (value) {
          return `${value}G`;
        }
        return '-';
      },
    },
    {
      title: 'User CPU Quota',
      dataIndex: 'quotaCpu',
      sorter: true,
      sortOrder: reducedOrderBy.quotaCpu,
      visible: !modelDeploymentOnly,
      render: text => {
        return text === null ? '∞' : text;
      },
    },
    {
      title: 'User GPU Quota',
      dataIndex: 'quotaGpu',
      sorter: true,
      sortOrder: reducedOrderBy.quotaGpu,
      visible: !modelDeploymentOnly,
      render: text => {
        return text === null ? '∞' : text;
      },
    },
    {
      title: 'Group CPU Quota',
      dataIndex: 'projectQuotaCpu',
      sorter: true,
      sortOrder: reducedOrderBy.projectQuotaCpu,
      render: text => {
        return text === null ? '∞' : text;
      },
    },
    {
      title: 'Group GPU Quota',
      dataIndex: 'projectQuotaGpu',
      sorter: true,
      sortOrder: reducedOrderBy.projectQuotaGpu,
      render: text => {
        return text === null ? '∞' : text;
      },
    },
    {
      title: 'Action',
      dataIndex: 'id',
      key: 'action',
      render: renderAction,
      width: '100px',
    },
  ];

  const searchHandler = keyword => {
    setSearch(encodeURIComponent(keyword));
    setCurrentPage(null);
  };

  const tableChangeHandler = (pagination, filters, sorter) => {
    const { field, order } = sorter;
    const sequence = order === 'ascend' ? 'asc' : 'desc';
    if (field) {
      setOrderBy(`{"${field}":"${sequence}"}`);
    } else {
      setOrderBy(null);
    }
    if (pagination.current) {
      setCurrentPage(`${pagination.current}`);
    } else {
      setCurrentPage(null);
    }
  };

  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={'Groups'}
      />
      <PageBody>
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
            onClick={add}
            style={{ marginRight: 16, width: 120 }}
            type='primary'
          >
            Add Group
          </InfuseButton>
        </div>
        <FilterRow
          type='flex'
          justify='space-between'
          align='bottom'
          style={{ marginBottom: 16, marginTop: 16 }}
        >
          <Col key='search-handler' style={{ flex: 1 }}>
            <FilterPlugins style={{ marginRight: '10px' }}>
              <Search
                data-testid='text-filter-name'
                placeholder={`Search Group`}
                defaultValue={search}
                onSearch={searchHandler}
              />
            </FilterPlugins>
          </Col>
          <ButtonCol></ButtonCol>
        </FilterRow>
        <List
          loading={props.loading}
          dataSource={props.dataSource}
          columns={columns}
          onChange={tableChangeHandler}
          pagination={paginationData}
        />
      </PageBody>
    </Layout>
  );
}

export default compose(
  withRouter,
  withApollo,
  graphql(GroupsConnection, {
    options: (props: RouteComponentProps) => {
      try {
        const params: { orderBy?: string; s?: string } = queryString.parse(
          props.location.search.replace(/^\?/, '')
        );
        const orderBy = JSON.parse((params.orderBy as string) || '{}');
        const where: { search?: string } = {};
        if (params.s) {
          where.search = params.s;
        }
        return {
          variables: {
            orderBy,
            where,
          },
          fetchPolicy: 'cache-and-network',
        };
      } catch (e) {
        return {
          fetchPolicy: 'cache-and-network',
        };
      }
    },
    name: 'listGroup',
  }),
  graphql(DeleteGroup, {
    options: (props: any) => ({
      refetchQueries: [
        {
          query: GroupsConnection,
          variables: props.listGroup.variables,
        },
      ],
      onError: errorHandler,
    }),
    name: 'deleteGroup',
    alias: 'withDeleteGroup',
  })
)(props => {
  const { listGroup, deleteGroup, client } = props;
  const { group, loading } = listGroup;
  const dataSource = group ? group.edges.map(edge => edge.node) : [];
  return (
    <React.Fragment>
      <GroupList
        client={client}
        dataSource={dataSource}
        listGroup={listGroup}
        deleteGroup={deleteGroup}
        loading={loading}
      />
    </React.Fragment>
  );
});
