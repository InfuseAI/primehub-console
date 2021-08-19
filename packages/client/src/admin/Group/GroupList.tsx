import * as React from 'react';
import { Modal, Input, Col, Layout, Button } from 'antd';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { List } from './list';
import { reduce } from 'lodash';
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
  const DISABLE_GROUP = (window as any).disableGroup || false;
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/group_next/,
      title: 'Groups',
      link: '/groups?page=1',
      tips: 'Admin can find and manage groups here.',
      tipsLink: 'https://docs.primehub.io/docs/guide_manual/admin-group',
    },
  ];

  const edit = id => {};
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
      onOk() {
        return deleteGroup({ variables: { where: { id } } });
      },
    });
  };

  const renderAction = (id, record) => {
    return (
      <ButtonGroup>
        <Button
          icon={'edit'}
          data-testid='edit-button'
          onClick={() => this.edit(record.id)}
        ></Button>
        <Button
          icon='delete'
          data-testid='delete-button'
          disabled={DISABLE_GROUP === true}
          onClick={() => remove(id, record)}
        />
      </ButtonGroup>
    );
  };

  const params = queryString.parse(
    props.history.location.search.replace(/^\?/, '')
  );
  let orderBy = {};
  try {
    orderBy = JSON.parse((params.orderBy as string) || '{}');
  } catch (e) {
    console.error(e);
  }
  const { page } = params;
  const paginationData = {
    current: +page,
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
    orderBy,
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

  const searchHandler = () => {};
  const tableChangeHandler = (pagination, filters, sorter) => {
    const { history } = props;
    const { field, order } = sorter;
    const search = [];
    const sequence = order === 'ascend' ? 'asc' : 'desc';
    if (field) {
      search.push(`orderBy={"${field}":"${sequence}"}`);
    }
    if (pagination.current) {
      search.push(`page=${pagination.current}`);
    }
    history.replace({
      search: `?${search.join('&')}`,
    });
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
            icon='plus'
            onClick={() => {}}
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
              <Search placeholder={`Search Group`} onSearch={searchHandler} />
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
        const params = queryString.parse(
          props.location.search.replace(/^\?/, '')
        );
        const orderBy = JSON.parse((params.orderBy as string) || '{}');
        return {
          variables: {
            orderBy,
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
        history={props.history}
        dataSource={dataSource}
        listGroup={listGroup}
        deleteGroup={deleteGroup}
        loading={loading}
      />
    </React.Fragment>
  );
});
