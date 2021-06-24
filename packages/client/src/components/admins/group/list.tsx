import * as React from 'react';
import { Layout, Button } from 'antd';
import { withRouter } from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {List} from '../list';
import PageTitle from 'components/pageTitle';
import Breadcrumbs from 'components/share/breadcrumb';
import { GroupsConnection } from 'queries/Group.graphql';
import queryString from 'querystring';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

const ButtonGroup = Button.Group;

interface Props {
  dataSource: any;
  loading?: boolean;
};

export function GroupList(props: Props) {
  const DISABLE_GROUP = (window as any).disableGroup || false;
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/group_next/,
      title: 'Groups',
      link: '/groups?page=1',
      tips: 'Admin can find and manage groups here.',
      tipsLink: 'https://docs.primehub.io/docs/guide_manual/admin-group'
    }
  ];

  const edit = (id) => {};
  const remove = (index) => {};

  const renderAction = (id, record) => {
    return (
      <ButtonGroup>
        <Button icon={"edit"}
          data-testid="edit-button"
          onClick={() => this.edit(record.id)}
        >
        </Button>
        <Button icon="delete"
          data-testid="delete-button"
          disabled={DISABLE_GROUP === true}
          onClick={() => this.remove(record.__index)}
        />
      </ButtonGroup>
    );
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    }, {
      title: 'Display Name',
      dataIndex: 'displayName',
      sorter: true,
    }, {
      title: "Share Volume Capacity",
      dataIndex: 'sharedVolumeCapacity',
      sorter: true,
      // @ts-ignore
      visible: !modelDeploymentOnly,
      render: (value) => {
        if (value) {
          return `${value}G`
        }
        return '-'
      }
    }, {
      title: 'User CPU Quota',
      dataIndex: 'quotaCpu',
      sorter: true,
      // @ts-ignore
      visible: !modelDeploymentOnly,
      render: text => {
        return text === null ? '∞' : text;
      },
    }, {
      title: 'User GPU Quota',
      dataIndex: 'quotaGpu',
      sorter: true,
      // @ts-ignore
      visible: !modelDeploymentOnly,
      render: text => {
        return text === null ? '∞' : text;
      },
    }, {
      title: 'Group CPU Quota',
      dataIndex: 'projectQuotaCpu',
      sorter: true,
      render: text => {
        return text === null ? '∞' : text;
      }
    }, {
      title: 'Group GPU Quota',
      dataIndex: 'projectQuotaGpu',
      sorter: true,
      render: text => {
        return text === null ? '∞' : text;
      }
    }, {
      title: 'Action',
      dataIndex: 'id',
      key: 'action',
      render: renderAction,
      width: 200
    }
  ];

  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={"Groups"}
      />
      <List
        loading={props.loading}
        dataSource={props.dataSource}
        columns={columns}
      />
    </Layout>
  );
}

export default compose(
  withRouter,
  graphql(GroupsConnection, {
    options: (props: RouteComponentProps) => {
      const params = queryString.parse(
        props.location.search.replace(/^\?/, '')
      );
      return {
        variables: {
          orderBy: JSON.parse((params.orderBy as string) || '{}'),
          page: Number(params.page || 1),
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getGroupsConnection',
  }),
)((props) => {
  const { getGroupsConnection } = props;
  const { group, loading } = getGroupsConnection;
  const dataSource = group ? group.edges.map((edge) => edge.node) : [];
  return (
    <React.Fragment>
      <GroupList dataSource={dataSource} loading={loading}/>
    </React.Fragment>
  )
});

