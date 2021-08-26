import React, { useState, useEffect } from 'react';
import {
  notification,
  Form,
  Tabs,
  Table,
  Input,
  Switch,
  Row,
  Col,
  Layout,
  Button,
  Modal,
  Icon,
} from 'antd';
import { get } from 'lodash';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { compose } from 'recompose';
import Breadcrumbs from 'components/share/breadcrumb';
import queryString from 'querystring';
import { graphql } from 'react-apollo';
import { errorHandler } from 'utils/errorHandler';
import { CreateUser } from 'queries/User.graphql';
import InfuseButton from 'components/infuseButton';
import PHTooltip from 'components/share/toolTip';
import { withRouter, useHistory, useLocation } from 'react-router-dom';

const { TabPane } = Tabs;

function AddPage(props: any) {
  const { form } = props;
  const history = useHistory();
  const location = useLocation();
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/user/,
      title: 'Users',
      link: '/user',
    },
    {
      key: 'add',
      matcher: /\/user\/add/,
      title: `Add User`,
    },
  ];

  const onSubmit = e => {
    const { createUser } = props;
    e.preventDefault();
    form.validateFields(
      async (
        err,
        values: { username: string; email: string; sendEmail: boolean }
      ) => {
        if (err) return;
        createUser({
          variables: {
            payload: values,
          },
        });
      }
    );
  };

  const onCancel = () => {
    const pathname = get(location, 'state.prevPathname');
    const search = get(location, 'state.prevSearch');
    if (pathname) {
      return history.push(`${pathname}${search}`);
    }
    history.push(`../user`);
  };

  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title='Add User'
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
          <TabPane key='info' tab='Basic Info'>
            <Form onSubmit={onSubmit}>
              <Form.Item label={'Username'}>
                {form.getFieldDecorator('username', {
                  rules: [
                    {
                      required: true,
                      pattern: /^[a-z0-9][-a-z0-9_.@]*$/,
                      message: `Only lower case alphanumeric characters, '-', '.', and underscores ("_") are allowed, and must start with a letter or numeric.`,
                    },
                  ],
                  initialValue: '',
                })(<Input />)}
              </Form.Item>
              <Form.Item label={'Email'}>
                {form.getFieldDecorator('email', {
                  rules: [
                    {
                      pattern:
                        /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                      message: `Please fill a valid email address format.`,
                    },
                  ],
                  initialValue: '',
                })(<Input />)}
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    Send Activation Email{' '}
                    <PHTooltip
                      tipText='Sending the activation email to perform different actions.'
                      tipLink='https://docs.primehub.io/docs/guide_manual/admin-user#send-email'
                      placement='right'
                      style={{ margintLeft: 8 }}
                    />
                  </span>
                }
              >
                {form.getFieldDecorator('sendEmail', {
                  initialValue: false,
                  valuePropName: 'checked',
                })(
                  <Switch
                    checkedChildren={<Icon type='check' />}
                    unCheckedChildren={<Icon type='close' />}
                  />
                )}
              </Form.Item>
              <Form.Item style={{ textAlign: 'right', marginTop: 12 }}>
                <InfuseButton
                  type='primary'
                  htmlType='submit'
                  style={{ marginRight: 16 }}
                >
                  Create
                </InfuseButton>
                <InfuseButton onClick={onCancel}>Cancel</InfuseButton>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </PageBody>
    </Layout>
  );
}

export const UserAdd = compose(
  Form.create(),
  withRouter,
  graphql(CreateUser, {
    name: 'createUser',
    alias: 'withCreateUser',
    options: (props: any) => ({
      onCompleted: (data: any) => {
        const { history } = props;
        history.push(`../user`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              User {data.createUser.username} Created. Click{' '}
              <a onClick={() => history.push(`user/${data.createUser.id}`)}>
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
