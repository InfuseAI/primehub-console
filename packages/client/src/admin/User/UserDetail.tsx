import React, { useState, useEffect } from 'react';
import {
  notification,
  Form,
  Switch,
  Skeleton,
  Tabs,
  Layout,
  Icon,
  Input,
} from 'antd';
import {
  withRouter,
  useParams,
  useLocation,
  useHistory,
  Link,
} from 'react-router-dom';
import { get, isArray, sortBy } from 'lodash';
import { RouteComponentProps } from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { compose } from 'recompose';
import Breadcrumbs from 'components/share/breadcrumb';
import { graphql } from 'react-apollo';
import InfuseButton from 'components/infuseButton';
import SendEmail from 'cms-components/customize-object-email_form';
import ResetPassword from 'cms-components/customize-object-password_form';
import CheckableInputNumber from 'cms-components/customize-number-checkbox';
import CustomRelationTable from '../share/RelationTable';
import { User, UpdateUser, UserGroups } from 'queries/User.graphql';
import { errorHandler } from 'utils/errorHandler';

const { TabPane } = Tabs;

const GroupsRelationTable = compose(
  graphql(UserGroups, {
    name: 'queryUserGroups',
    alias: 'withQueryUserGroups',
  })
)((props: any) => {
  const { onChange, value, queryUserGroups } = props;
  const userGroups = get(queryUserGroups, 'groups', []);
  const relationRefetch = newVariables => {
    const { refetch, variables } = queryUserGroups;
    refetch({
      ...variables,
      ...newVariables,
    });
  };

  const groupColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      // eslint-disable-next-line react/display-name
      render: (text, record) => {
        return <Link to={`../group/${record.id}`}>{text}</Link>;
      },
    },
    {
      title: 'Display Name',
      dataIndex: 'displayName',
    },
    {
      title: 'CPU Quota',
      dataIndex: 'quotaCpu',
      render: text => {
        return text === null ? '∞' : text;
      },
      // @ts-ignore
      visible: !modelDeploymentOnly,
    },
    {
      title: 'GPU Quota',
      dataIndex: 'quotaGpu',
      render: text => {
        return text === null ? '∞' : text;
      },
      // @ts-ignore
      visible: !modelDeploymentOnly,
    },
  ];

  const groupPickerColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
    },
    ...groupColumns.slice(1),
  ];

  return (
    <CustomRelationTable
      title='Edit Groups'
      searchPlaceholder='Search group name'
      onChange={onChange}
      loading={queryUserGroups.loading}
      value={value}
      relationValue={userGroups}
      relation={{
        to: 'group',
        type: 'toMany',
        fields: ['name', 'displayName', 'quotaCpu', 'quotaGpu'],
      }}
      uiParams={{
        columns: groupColumns,
        pickerColumns: groupPickerColumns,
      }}
      relationRefetch={relationRefetch}
    />
  );
});

function DetailPage(props: any) {
  const { form, queryUser, queryUserGroups } = props;
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const history = useHistory();
  const [connections, setConnections] = useState({
    connect: [],
    disconnect: [],
  });
  const user = get(queryUser, 'user', {});
  const userGroups = get(queryUserGroups, 'groups', []);
  const [relateGroups, setRelateGroups] = useState([]);
  // Effect for original user data
  useEffect(() => {
    setRelateGroups(get(user, 'groups', []));
  }, [user]);
  // Effect when connection changed
  useEffect(() => {
    if (connections.connect.length > 0 || connections.disconnect.length > 0) {
      const allGroups = userGroups.edges.map(edge => edge.node);
      const { connect, disconnect } = connections;
      const resultIds = [
        ...relateGroups
          .filter(g => !disconnect.map(d => d.id).includes(g.id))
          .map(g => g.id),
        ...connect.map(c => c.id),
      ];
      setRelateGroups(
        sortBy(
          allGroups.filter(g => resultIds.includes(g.id)),
          [o => o.name.toLowerCase()]
        )
      );
    }
  }, [connections]);
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/user/,
      title: 'Users',
      link: '/user',
    },
    {
      key: 'detail',
      matcher: /\/user\/([\w-])+/,
      title: `User: ${get(user, 'username', '')}`,
    },
  ];

  const handleRelationConnection = actions => {
    if (isArray(actions) && actions.length > 0) {
      const disconnect = actions
        .filter(action => action.type === 'disconnect')
        .map(d => {
          return { id: d.value.id };
        });
      const connect = actions
        .filter(action => action.type === 'connect')
        .map(c => {
          return { id: c.value.id };
        });
      setConnections({ disconnect, connect });
    }
  };

  const onSubmit = e => {
    const { updateUser } = props;
    e.preventDefault();
    form.validateFields(async (err, values) => {
      if (err) return;
      updateUser({
        variables: {
          payload: {
            ...values,
            groups: connections,
          },
        },
      });
    });
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
        title={'Users'}
      />
      <PageBody>
        <Tabs>
          <TabPane key='info' tab='Basic Info'>
            <Skeleton loading={queryUser.loading || queryUserGroups.loading}>
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
                  })(<Input disabled={true} />)}
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
                    valuePropName: 'checked',
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
                    valuePropName: 'checked',
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
                    getValueFromEvent: (refId, action, val) => val,
                  })(
                    <CheckableInputNumber
                      uiParams={{
                        unit: ' GB',
                        step: 1,
                        min: 1,
                        precision: 0,
                        disableText: 'use default value',
                      }}
                    />
                  )}
                </Form.Item>
                <Form.Item label={'Groups'}>
                  <GroupsRelationTable
                    onChange={handleRelationConnection}
                    value={relateGroups}
                  />
                </Form.Item>
                <Form.Item style={{ textAlign: 'right', marginTop: 12 }}>
                  <InfuseButton
                    type='primary'
                    htmlType={'submit'}
                    style={{ marginRight: 16 }}
                  >
                    Update
                  </InfuseButton>
                  <InfuseButton onClick={onCancel}>Cancel</InfuseButton>
                </Form.Item>
              </Form>
            </Skeleton>
          </TabPane>
          <TabPane key='send-email' tab='Send Email'>
            <SendEmail rootValue={{}} refId={{}} id={id} />
          </TabPane>
          <TabPane key='rese-pwd' tab='Reset Password'>
            <ResetPassword rootValue={{}} refId={{}} id={id} />
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
    name: 'queryUser',
    alias: 'withQueryUser',
  }),
  graphql(UpdateUser, {
    name: 'updateUser',
    alias: 'withUpdateUser',
    options: (props: any) => ({
      variables: {
        where: {
          id: props.match.params.id,
        },
      },
      onCompleted: (data: any) => {
        const { history } = props;
        history.push(`../user`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              User {data.updateUser.username} updated. Click{' '}
              <a onClick={() => history.push(`user/${data.updateUser.id}`)}>
                here
              </a>{' '}
              to view.
            </>
          ),
        });
      },
      onError: errorHandler,
    }),
  }),
  graphql(UserGroups, {
    name: 'queryUserGroups',
    alias: 'withQueryUserGroups',
    options: () => {
      return {
        fetchPolicy: 'cache-and-network',
      };
    },
  })
)(DetailPage);
