import React, { useState, useEffect } from 'react';
import { Tabs, Table, Input, Col, Layout, Button, Icon, Modal } from 'antd';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { compose } from 'recompose';
import Breadcrumbs from 'components/share/breadcrumb';
import queryString from 'querystring';
import { graphql } from 'react-apollo';

const { TabPane } = Tabs;


function AddPage(props: any) {
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/user_next/,
      title: 'Users',
      link: 'admin/users_next?page=1',
    },
    {
      key: 'add',
      matcher: /\/user_next\/add/,
      title: `Add User`,
    }
  ];
  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={"Add User"}
      />
      <PageBody>
        <Tabs>
          <TabPane key='info' tab='Basic Info'>Basic Info</TabPane>
        </Tabs>
      </PageBody>
    </Layout>
  );
}

export const UserAdd = compose()(AddPage);
