import React, { useState, useEffect } from 'react';
import { Tabs, Table, Input, Col, Layout, Button, Icon, Modal } from 'antd';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { compose } from 'recompose';
import Breadcrumbs from 'components/share/breadcrumb';
import queryString from 'querystring';
import { graphql } from 'react-apollo';

const { TabPane } = Tabs;


function DetailPage(props: any) {
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/user_next/,
      title: 'Users',
      link: 'admin/users_next?page=1',
    },
    {
      key: 'detail',
      matcher: /\/user_next\/([\w-])+/,
      title: `User`,
    }
  ];
  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={"Users"}
      />
      <PageBody>
        <Tabs>
          <TabPane key='info' tab='Basic Info'>Basic Info</TabPane>
          <TabPane key='send-email' tab='Send Email'>Send Email</TabPane>
          <TabPane key='rese-pwd' tab='Reset Password'>Reset Password</TabPane>
        </Tabs>
      </PageBody>
    </Layout>
  );
}

export const UserDetail = compose()(DetailPage);
