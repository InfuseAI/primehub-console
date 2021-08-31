import React from 'react';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get, omit, uniqBy } from 'lodash';
import {
  withRouter,
  useLocation,
  useHistory,
  useParams,
  RouteComponentProps,
} from 'react-router-dom';
import { notification, Card, Tabs, Row, Col, Layout, Icon, Button } from 'antd';
import { List } from './list';
import { Group, UpdateGroup } from 'queries/Group.graphql';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { errorHandler } from 'utils/errorHandler';
import InfuseButton from 'components/infuseButton';
import GroupForm from './Form';
const appPrefix = window.APP_PREFIX || '/';
const { TabPane } = Tabs;

function UpdatePage(props: any) {
  const { getGroup } = props;
  const { loading } = getGroup;
  const group = get(getGroup, 'group', {});
  const everyoneGroup = get(getGroup, 'everyoneGroup', {});
  const location = useLocation();
  const history = useHistory();
  const params = useParams<{ id: string; activeKey?: string }>();
  const { activeKey = 'info' } = params;
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/group/,
      title: 'Groups',
      link: '/group',
      tips: 'Admin can find and manage groups here.',
      tipsLink: 'https://docs.primehub.io/docs/guide_manual/admin-group',
    },
    {
      key: 'update',
      matcher: /\/group\/([\w-])+/,
      title: `Group: ${get(group, 'name', '')}`,
    },
  ];

  const instanceTypesSource = uniqBy(
    get(everyoneGroup, 'instanceTypes', []).concat(
      get(group, 'instanceTypes', [])
    ),
    'id'
  );

  const imagesSource = uniqBy(
    get(everyoneGroup, 'images', []).concat(get(group, 'images', [])),
    'id'
  );

  const datasetsSource = uniqBy(
    get(everyoneGroup, 'datasets', []).concat(get(group, 'datasets', [])),
    'id'
  );

  const instanceTypesColumns = [
    {
      title: 'Display Name',
      dataIndex: 'displayName',
    },
    {
      title: 'Description',
      dataIndex: 'discription',
    },
    {
      title: 'CPU Limit',
      dataIndex: 'cpuLimit',
      align: 'center',
      render: value => value || 0,
    },
    {
      title: 'Memory Limit',
      dataIndex: 'memoryLimit',
      align: 'center',
      render: text => `${text || 0} GB`,
    },
    {
      title: 'GPU Limit',
      dataIndex: 'gpuLimit',
      align: 'center',
      render: value => value || 0,
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      align: 'center',
      render: value => {
        return (
          <Button
            icon={'edit'}
            data-testid='edit-button'
            onClick={() =>
              history.push(`${appPrefix}admin/instanceType/${value}`)
            }
          ></Button>
        );
      },
    },
  ];

  const imagesColumns = [
    {
      title: 'Display Name',
      dataIndex: 'displayName',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      align: 'center',
      render: value => {
        if (!value) {
          return '-';
        }

        if (value === 'both') {
          return 'universal';
        }

        return value;
      },
    },
    {
      title: 'Description',
      dataIndex: 'discription',
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      align: 'center',
      render: value => {
        return (
          <Button
            icon={'edit'}
            data-testid='edit-button'
            onClick={() => history.push(`${appPrefix}admin/image/${value}`)}
          ></Button>
        );
      },
    },
  ];

  const datasetsColumns = [
    {
      title: 'Display Name',
      dataIndex: 'displayName',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      align: 'center',
    },
    {
      title: 'Description',
      dataIndex: 'discription',
    },
    {
      title: 'Permissions',
      dataIndex: 'writable',
      align: 'center',
      render: writable => (writable ? 'Writable' : 'Read Only'),
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      align: 'center',
      render: value => {
        return (
          <Button
            icon={'edit'}
            data-testid='edit-button'
            onClick={() => history.push(`${appPrefix}admin/dataset/${value}`)}
          ></Button>
        );
      },
    },
  ];

  const onSubmit = data => {
    const { updateGroup } = props;
    const { connect, disconnect } = data.users;
    const payload = {
      ...omit(data, ['name', 'enabledSharedVolume', 'sharedVolumeCapacity']),
      users: {
        connect: connect.map(c => {
          return {
            id: c.id,
          };
        }),
        disconnect: disconnect.map(c => {
          return {
            id: c.id,
          };
        }),
      },
    };
    updateGroup({
      variables: {
        data: payload,
      },
    });
  };

  const onCancel = () => {
    history.push(`${appPrefix}admin/group`);
  };

  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title='Add Group'
      />
      <PageBody>
        <Row>
          <Col>
            <InfuseButton onClick={onCancel}>
              <Icon type='arrow-left' /> Back
            </InfuseButton>
          </Col>
        </Row>
        <Tabs
          style={{ marginTop: 24 }}
          animated={{ inkBar: true, tabPane: false }}
          activeKey={activeKey}
          onChange={key => {
            history.push(`${appPrefix}admin/group/${params.id}/${key}`);
          }}
        >
          <TabPane key='info' tab='Info'>
            <GroupForm
              loading={loading}
              type={'update'}
              onSubmit={onSubmit}
              onCancel={onCancel}
              initialValue={group}
            />
          </TabPane>
          <TabPane key='instanceType' tab='Instance Types'>
            <Card title={'Instance Types'}>
              <List
                loading={loading}
                columns={instanceTypesColumns}
                dataSource={instanceTypesSource}
              />
            </Card>
          </TabPane>
          {/* @ts-ignore */}
          {__ENV__ === 'modelDeploy' ? (
            <></>
          ) : (
            <TabPane key='images' tab='Images'>
              <Card title={'Images'}>
                <List
                  loading={loading}
                  columns={imagesColumns}
                  dataSource={imagesSource}
                />
              </Card>
            </TabPane>
          )}
          {/* @ts-ignore */}
          {__ENV__ === 'modelDeploy' ? (
            <></>
          ) : (
            <TabPane key='datasets' tab='Datasets'>
              <Card title={'Datasets'}>
                <List
                  loading={loading}
                  columns={datasetsColumns}
                  dataSource={datasetsSource}
                />
              </Card>
            </TabPane>
          )}
        </Tabs>
      </PageBody>
    </Layout>
  );
}

export default compose(
  withRouter,
  graphql(Group, {
    options: (props: RouteComponentProps<{ id: string }>) => {
      return {
        onError: errorHandler,
        variables: {
          where: {
            id: props.match.params.id,
          },
          everyoneGroupWhere: {
            id: window.everyoneGroupId,
          },
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getGroup',
    alias: 'withGetGroup',
  }),
  graphql(UpdateGroup, {
    name: 'updateGroup',
    alias: 'withUpdateGroup',
    options: (props: any) => ({
      variables: {
        where: {
          id: props.match.params.id,
        },
      },
      onCompleted: (data: any) => {
        const { history } = props;
        history.push(`${appPrefix}admin/group`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Group {data.updateGroup.name} updated. Click{' '}
              <a
                onClick={() =>
                  history.push(`group/${data.updateGroup.id}`)
                }
              >
                here
              </a>{' '}
              to view.
            </>
          ),
        });
      },
      onError: errorHandler,
    }),
  })
)(UpdatePage);
