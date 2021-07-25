import React, { useState, useEffect } from 'react';
import { Tabs, Table, Input, Col, Layout, Button, Icon, Modal } from 'antd';
import { withRouter, useParams } from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { compose } from 'recompose';
import Breadcrumbs from 'components/share/breadcrumb';
import queryString from 'querystring';
import { graphql } from 'react-apollo';
import SendEmail from 'cms-components/customize-object-email_form';
import ResetPassword from 'cms-components/customize-object-password_form';
import { UsersConnection } from 'queries/User.graphql';

const { TabPane } = Tabs;


function DetailPage(props: any) {
  const { id } = useParams<{id: string}>();
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/user_next/,
      title: 'Users',
      link: 'admin/users_next',
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
          <TabPane key='send-email' tab='Send Email'>
            <SendEmail rootValue={{}} refId={{}} id={id}/>
          </TabPane>
          <TabPane key='rese-pwd' tab='Reset Password'>
            <ResetPassword rootValue={{}} refId={{}} id={id}/>
          </TabPane>
        </Tabs>
      </PageBody>
    </Layout>
  );
}

export const UserDetail = compose(
  withRouter,
  graphql(UsersConnection, {
    options: (props: RouteComponentProps<{id: string}>) => {
      return {
        variables: {
          where: {
            id: props.match.params.id,
          },
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'queryUser',
    alias: 'withQueryUser',
  }),
)(DetailPage);
