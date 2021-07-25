import React, { useState, useEffect } from 'react';
import { Form, Switch, Skeleton, Tabs, Table, Input, Col, Layout, Button, Icon, Modal } from 'antd';
import { withRouter, useParams } from 'react-router-dom';
import { get } from 'lodash';
import { RouteComponentProps } from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { compose } from 'recompose';
import Breadcrumbs from 'components/share/breadcrumb';
import queryString from 'querystring';
import { graphql } from 'react-apollo';
import InfuseButton from 'components/infuseButton';
import PHTooltip from 'components/share/toolTip';
import SendEmail from 'cms-components/customize-object-email_form';
import ResetPassword from 'cms-components/customize-object-password_form';
import CheckableInputNumber from 'cms-components/customize-number-checkbox';
import { User } from 'queries/User.graphql';
import { errorHandler } from 'utils/errorHandler';

const { TabPane } = Tabs;

function DetailPage(props: any) {
  const { form, queryUser } = props;
  const { id } = useParams<{id: string}>();
  const user = get(queryUser, 'user', {});
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
      title: `User: ${get(user, 'username', '')}`,
    }
  ];

  const onSubmit = () => {

  }
  const onCancel = () => {

  }
  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={"Users"}
      />
      <PageBody>
          <Tabs>
            <TabPane key='info' tab='Basic Info'>
              <Skeleton loading={queryUser.loading}>
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
                      initialValue: get(user, 'username'),
                    })(<Input disabled={true}/>)}
                  </Form.Item>
                  <Form.Item label={'Email'}>
                    {form.getFieldDecorator('email', {
                      rules: [
                        {
                          pattern: /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                          message: `Please fill a valid email address format.`
                        },
                      ],
                      initialValue: get(user, 'email'),
                    })(<Input />)}
                  </Form.Item>
                  <Form.Item label={'First Name'}>
                    {form.getFieldDecorator('firstName', {
                      initialValue: get(user, 'firstName'),
                    })(<Input />)}
                  </Form.Item>
                  <Form.Item label={'Last Name'}>
                    {form.getFieldDecorator('lastName', {
                      initialValue: get(user, 'lastName'),
                    })(<Input />)}
                  </Form.Item>
                  <Form.Item label={'Enabled'}>
                    {form.getFieldDecorator('enabled', {
                      initialValue: get(user, 'enabled', false),
                      valuePropName: 'checked'
                    })(
                    <Switch
                      checkedChildren={<Icon type='check' />}
                      unCheckedChildren={<Icon type='close' />}
                    />
                  )}
                  </Form.Item>
                  <Form.Item label={'Is Admin'}>
                    {form.getFieldDecorator('isAdmin', {
                      initialValue: get(user, 'isAdmin', false),
                      valuePropName: 'checked'
                    })(
                    <Switch
                      checkedChildren={<Icon type='check' />}
                      unCheckedChildren={<Icon type='close' />}
                    />
                    )}
                  </Form.Item>
                  <Form.Item label={'Personal Volume Capacity'}>
                    {form.getFieldDecorator('volumeCapacity', {
                      initialValue: get(user, 'volumeCapacity', null),
                      getValueFromEvent: (refId, action, val) => val
                    })(
                      <CheckableInputNumber
                        uiParams={{unit: ' GB', step: 1, min: 1, precision: 0, disableText: 'use default value'}}
                      />
                    )}
                  </Form.Item>
                  <Form.Item style={{textAlign: 'right', marginTop: 12}}>
                    <InfuseButton
                      type='primary'
                      htmlType='submit'
                      style={{marginRight: 16}}
                    >
                      Update
                    </InfuseButton>
                    <InfuseButton onClick={onCancel}>
                      Cancel
                    </InfuseButton>
                  </Form.Item>
                </Form>
              </Skeleton>
            </TabPane>
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
  Form.create(),
  withRouter,
  graphql(User, {
    options: (props: RouteComponentProps<{id: string}>) => {
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
    name: 'queryUser',
    alias: 'withQueryUser',
  }),
)(DetailPage);
