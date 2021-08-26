import React from 'react';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get } from 'lodash';
import { withRouter, useLocation, useHistory } from 'react-router-dom';
import { notification, Tabs, Row, Col, Layout, Icon } from 'antd';
import { CreateGroup } from 'queries/Group.graphql';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { errorHandler } from 'utils/errorHandler';
import InfuseButton from 'components/infuseButton';
import GroupForm from './Form';
const { TabPane } = Tabs;

function AddPage(props: any) {
  const location = useLocation();
  const history = useHistory();
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
      key: 'add',
      matcher: /\/group\/add/,
      title: `Add Group`,
    },
  ];

  const onSubmit = (data, relateUsers) => {
    const { createGroup } = props;
    const payload = {
      ...data,
      users: {
        connect: relateUsers.map(r => {
          return {
            id: r.id,
          };
        }),
      },
    };
    createGroup({
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
    history.push(`../group`);
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
            <GroupForm onSubmit={onSubmit} onCancel={onCancel} />
          </TabPane>
        </Tabs>
      </PageBody>
    </Layout>
  );
}

export default compose(
  withRouter,
  graphql(CreateGroup, {
    name: 'createGroup',
    alias: 'withCreateGroup',
    options: (props: any) => ({
      onCompleted: (data: any) => {
        const { history } = props;
        history.push(`../group`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Group {data.createGroup.name} Created. Click{' '}
              <a onClick={() => history.push(`group/${data.createGroup.id}`)}>
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
)(AddPage);
