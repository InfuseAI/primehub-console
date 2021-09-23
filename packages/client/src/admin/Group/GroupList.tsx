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
import { GroupsConnection, DeleteGroup } from 'queries/Group.graphql';
import queryString from 'querystring';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import InfuseButton from 'components/infuseButton';
import { FilterRow, FilterPlugins, ButtonCol } from 'components/share';
import { errorHandler } from 'utils/errorHandler';

const { confirm } = Modal;
const { Search } = Input;
const ButtonGroup = Button.Group;

type Props = {
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
  const remove = (id, record) => {
    const { deleteGroup } = props;
    const { name } = record;
    confirm({
      title: `Delete Group`,
      content: (
        <span>
          Do you really want to delete group: "<b>{name}</b>"?
        </span>
      ),
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      maskClosable: true,
      onOk() {
        return deleteGroup({ variables: { where: { id } } });
      },
    });
  };

  const renderAction = (id, record) => {
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
            onClick={() => remove(id, record)}
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
    },
    {
      title: 'Display Name',
      dataIndex: 'displayName',
      sorter: true,
      sortOrder: reducedOrderBy.displayName,
    },
    {
      title: 'Share Volume Capacity',
      dataIndex: 'sharedVolumeCapacity',
      sorter: true,
      sortOrder: reducedOrderBy.sharedVolumeCapacity,
      // @ts-ignore
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
      // @ts-ignore
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
      // @ts-ignore
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
      width: 200,
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
          {/* @ts-ignore */}
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
  graphql(GroupsConnection, {
    options: (props: RouteComponentProps) => {
      try {
        const params: { orderBy?: string; s?: string } = queryString.parse(
          props.location.search.replace(/^\?/, '')
        );
        const orderBy = JSON.parse((params.orderBy as string) || '{}');
        const where: { name_contains?: string } = {};
        if (params.s) {
          where.name_contains = params.s;
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
  const { listGroup, deleteGroup } = props;
  const { group, loading } = listGroup;
  const dataSource = group ? group.edges.map(edge => edge.node) : [];
  return (
    <React.Fragment>
      <GroupList
        dataSource={dataSource}
        listGroup={listGroup}
        deleteGroup={deleteGroup}
        loading={loading}
      />
    </React.Fragment>
  );
});
