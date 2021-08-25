import React from 'react';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get, omit } from 'lodash';
import {
  withRouter,
  useLocation,
  useHistory,
  RouteComponentProps,
} from 'react-router-dom';
import { notification, Tabs, Row, Col, Layout, Icon } from 'antd';
import { Group, UpdateGroup } from 'queries/Group.graphql';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { errorHandler } from 'utils/errorHandler';
import InfuseButton from 'components/infuseButton';
import GroupForm from './Form';
const { TabPane } = Tabs;

function UpdatePage(props: any) {
  const { getGroup } = props;
  const { loading } = getGroup;
  const group = get(getGroup, 'group', {});
  const location = useLocation();
  const history = useHistory();
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/group_next/,
      title: 'Groups',
      link: 'admin/group_next',
      tips: 'Admin can find and manage groups here.',
      tipsLink: 'https://docs.primehub.io/docs/guide_manual/admin-group',
    },
    {
      key: 'update',
      matcher: /\/group_next\/([\w-])+/,
      title: `Group: ${get(group, 'name', '')}`,
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
    const pathname = get(location, 'state.prevPathname');
    const search = get(location, 'state.prevSearch');
    if (pathname) {
      return history.push(`${pathname}${search}`);
    }
    history.push(`../group_next`);
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
        <Tabs style={{ marginTop: 24 }}>
          <TabPane key='info' tab='Info'>
            <GroupForm
              loading={loading}
              type={'update'}
              onSubmit={onSubmit}
              onCancel={onCancel}
              initialValue={group}
            />
          </TabPane>
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
        history.push(`../group_next`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Group {data.updateGroup.name} updated. Click{' '}
              <a
                onClick={() =>
                  history.push(`group_next/${data.updateGroup.id}`)
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
