import React, { useState, useEffect } from 'react';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import {
  Skeleton,
  Checkbox,
  Row,
  Col,
  Form,
  Input,
  Switch,
  Icon,
  Card,
  InputNumber,
} from 'antd';
import { isArray, get, sortBy, uniqBy } from 'lodash';
import { FormComponentProps } from 'antd/es/form';
import PHTooltip from 'components/share/toolTip';
import Feature, { FeatureEE } from 'components/share/feature';
import CheckableInputNumber from 'cms-components/customize-number-checkbox';
import InfuseButton from 'components/infuseButton';
import { UsersConnection } from 'queries/User.graphql';
import CustomRelationTable from '../share/RelationTable';

interface User {
  id: string;
  username: string;
}

export interface GroupInput {
  name: string;
  displayName: string;
  admins: string;
  enabledSharedVolume: boolean;
  enabledDeployment: boolean;
  launchGroupOnly: boolean;
  sharedVolumeCapacity: number;
  maxDeploy: number;
  quotaCpu: number;
  quotaGpu: number;
  quotaMemory: number;
  projectQuotaCpu: number;
  projectQuotaGpu: number;
  projectQuotaMemory: number;
  users: User[];
}

const defaultGroupValue: GroupInput = {
  name: '',
  displayName: '',
  admins: '',
  enabledSharedVolume: false,
  enabledDeployment: false,
  launchGroupOnly: false,
  sharedVolumeCapacity: 1,
  maxDeploy: null,
  quotaCpu: 0.5,
  quotaGpu: 0,
  quotaMemory: null,
  projectQuotaCpu: null,
  projectQuotaGpu: null,
  projectQuotaMemory: null,
  users: [],
};

interface Props extends FormComponentProps {
  onSubmit: (data: GroupInput, relateUsers?: any[]) => void;
  onCancel: () => void;
  initialValue?: GroupInput;
  loading?: boolean;
  type?: 'create' | 'update';
}

const UsersRelationTable = compose(
  graphql(UsersConnection, {
    name: 'queryUsers',
    alias: 'withQueryUsers',
  })
)((props: any) => {
  const {
    value,
    queryUsers,
    onChange = () => undefined,
    onAdminChange = () => undefined,
    admins,
  } = props;
  const { users, loading, refetch, variables } = queryUsers;
  const adminList = admins?.split(',') || [];
  const PAGE_SIZE = 10;
  const nextPage = () => {
    const after = users.pageInfo.endCursor;
    const newVariables = {
      userAfter: after,
      userFirst: PAGE_SIZE,
      userLast: undefined,
      userBefore: undefined,
    };
    refetch(newVariables);
  };

  const prevPage = () => {
    const before = users.pageInfo.startCursor;
    const newVariables = {
      userBefore: before,
      userFirst: PAGE_SIZE,
      userLast: undefined,
      userAfter: undefined,
    };
    refetch(newVariables);
  };

  const handleSearch = (searchText: string): void => {
    refetch({
      where: {
        username_contains: searchText,
      },
    });
  };

  const relationRefetch = newVariables => {
    refetch({
      ...variables,
      ...newVariables,
    });
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
    },
    {
      title: 'Group Admin',
      dataIndex: 'username',
      render: (val, record) => {
        return (
          <Checkbox
            key={record.id}
            value={val}
            onChange={onAdminChange}
            checked={adminList.includes(val)}
          />
        );
      },
    },
  ];

  const pickerColumns = [
    {
      title: 'Username',
      dataIndex: 'username',
    },
  ];

  return (
    <CustomRelationTable
      title='Edit Users'
      searchPlaceholder='Search username'
      handleSearch={handleSearch}
      onChange={onChange}
      loading={loading}
      value={value}
      relationValue={users}
      relation={{
        to: 'user',
        type: 'toMany',
      }}
      uiParams={{
        columns,
        pickerColumns,
      }}
      relationRefetch={relationRefetch}
      prevPage={prevPage}
      nextPage={nextPage}
    />
  );
});

function GroupForm(props: Props) {
  const { form, onSubmit, onCancel, type = 'create', loading = false } = props;
  const [connections, setConnections] = useState({
    connect: [],
    disconnect: [],
  });
  const [relateUsers, setRelateUsers] = useState([]);
  const [groupAdmins, setGroupAdmins] = useState('');
  const initialValue: GroupInput = props.initialValue || defaultGroupValue;
  const submitText = type === 'update' ? 'Update' : 'Create';

  useEffect(() => {
    setRelateUsers(get(initialValue, 'users', []));
    setGroupAdmins(get(initialValue, 'admins', ''));
  }, [initialValue]);

  useEffect(() => {
    if (connections.connect.length > 0 || connections.disconnect.length > 0) {
      const { connect, disconnect } = connections;
      const result = uniqBy(
        [
          ...relateUsers.filter(g => !disconnect.map(d => d.id).includes(g.id)),
          ...connect,
        ],
        'id'
      );
      const resultUsername = result.map(o => o.username);
      const adminList = groupAdmins
        .split(',')
        .filter(r => resultUsername.includes(r));
      setRelateUsers(sortBy(result, [o => o.username.toLowerCase()]));
      setGroupAdmins(adminList.join(','));
    }
  }, [connections]);

  const handleSubmit = e => {
    e.preventDefault();
    form.validateFields(async (err, values) => {
      if (err) return;
      const result = {
        ...values,
        admins: groupAdmins,
        users: connections,
      };
      onSubmit(result, relateUsers);
    });
  };

  const handleCancel = e => {
    e.preventDefault();
    onCancel();
  };

  const handleAdminChange = e => {
    e.preventDefault();
    const { target } = e;
    const username = target.value;
    const isAdmin = target.checked;
    const adminList = groupAdmins.split(',').filter(r => r && r !== username);
    if (isAdmin) adminList.push(username);
    setGroupAdmins(adminList.join(','));
  };

  const handleRelationConnection = actions => {
    if (isArray(actions) && actions.length > 0) {
      const { disconnect, connect } = connections;
      const newDisconnect = actions
        .filter(action => action.type === 'disconnect')
        .map(d => {
          return d.value;
        });
      const newConnect = actions
        .filter(action => action.type === 'connect')
        .map(d => {
          return d.value;
        });

      const disconnectResult = [
        ...disconnect.filter(r => !newConnect.map(c => c.id).includes(r.id)),
        ...newDisconnect,
      ];
      const connectResult = [
        ...connect.filter(r => !newDisconnect.map(d => d.id).includes(r.id)),
        ...newConnect,
      ];
      setConnections({ disconnect: disconnectResult, connect: connectResult });
    }
  };

  return (
    <Skeleton loading={loading} active>
      <Form onSubmit={handleSubmit}>
        <Form.Item label={'Name'}>
          {form.getFieldDecorator('name', {
            rules: [
              {
                required: true,
                pattern: /^[A-Za-z0-9][-\w]*[A-Za-z0-9]+$/,
                message: `Group name must begin and end with an alphanumeric character.`,
              },
            ],
            initialValue: initialValue.name,
          })(<Input disabled={type === 'update'} />)}
        </Form.Item>
        <Form.Item label={'Display Name'}>
          {form.getFieldDecorator('displayName', {
            initialValue: initialValue.displayName,
          })(<Input />)}
        </Form.Item>
        <FeatureEE>
          <Form.Item
            label={
              <span>
                Model Deployment{' '}
                <PHTooltip
                  tipText='The shared volume is shared storage among members in the group.'
                  tipLink='https://docs.primehub.io/docs/guide_manual/admin-group#model-deployment'
                  placement='right'
                  style={{ margintLeft: 8 }}
                />
              </span>
            }
          >
            {form.getFieldDecorator('enabledDeployment', {
              initialValue: initialValue.enabledDeployment,
              valuePropName: 'checked',
            })(
              <Switch
                checkedChildren={<Icon type='check' />}
                unCheckedChildren={<Icon type='close' />}
              />
            )}
          </Form.Item>
          {form.getFieldValue('enabledDeployment') ? (
            <Form.Item label={`Maximum Deployment(s)`}>
              {form.getFieldDecorator('maxDeploy', {
                initialValue: initialValue.maxDeploy,
                getValueFromEvent: (refId, action, val) => val,
              })(
                <CheckableInputNumber
                  uiParams={{ min: 0, step: 1, precision: 0 }}
                />
              )}
            </Form.Item>
          ) : (
            <></>
          )}
        </FeatureEE>
        <Feature modelDeploy={false}>
          <Form.Item
            label={
              <span>
                Share Volume{' '}
                <PHTooltip
                  tipText='The shared volume is shared storage among members in the group.'
                  tipLink='https://docs.primehub.io/docs/guide_manual/admin-group#shared-volume'
                  placement='right'
                  style={{ margintLeft: 8 }}
                />
              </span>
            }
          >
            {form.getFieldDecorator('enabledSharedVolume', {
              initialValue: initialValue.enabledSharedVolume,
              valuePropName: 'checked',
            })(
              <Switch
                disabled={type === 'update'}
                checkedChildren={<Icon type='check' />}
                unCheckedChildren={<Icon type='close' />}
              />
            )}
          </Form.Item>
        </Feature>
        {form.getFieldValue('enabledSharedVolume') ? (
          <Card title={'Shared Volume'} style={{ marginBottom: 16 }}>
            <Row>
              <Col sm={8} xs={24}>
                <Form.Item label={`Shared Volume Capacity`}>
                  {form.getFieldDecorator('sharedVolumeCapacity', {
                    initialValue: initialValue.sharedVolumeCapacity,
                  })(
                    <InputNumber
                      disabled={type === 'update'}
                      style={{ width: 'auto' }}
                      formatter={value => `${value} GB`}
                      parser={value => +value.replace(/[^0-9.]/g, '')}
                      precision={0}
                      min={1}
                      step={1}
                    />
                  )}
                </Form.Item>
              </Col>
              <Col sm={8} xs={24}>
                <Form.Item label={`Launch Group Only`}>
                  {form.getFieldDecorator('launchGroupOnly', {
                    initialValue: initialValue.launchGroupOnly,
                    valuePropName: 'checked',
                  })(
                    <Switch
                      checkedChildren={<Icon type='check' />}
                      unCheckedChildren={<Icon type='close' />}
                    />
                  )}
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ) : (
          <></>
        )}
        <Card title={'User Quota'} style={{ marginBottom: 16 }}>
          <Row>
            <Col sm={8} xs={24}>
              <Form.Item label={`CPU Quota`}>
                {form.getFieldDecorator('quotaCpu', {
                  initialValue: initialValue.quotaCpu,
                  getValueFromEvent: (refId, action, val) => val,
                })(
                  <CheckableInputNumber
                    uiParams={{ min: 0.5, step: 0.5, precision: 1 }}
                  />
                )}
              </Form.Item>
            </Col>
            <Col sm={8} xs={24}>
              <Form.Item label={`GPU Quota`}>
                {form.getFieldDecorator('quotaGpu', {
                  initialValue: initialValue.quotaGpu,
                  getValueFromEvent: (refId, action, val) => val,
                })(
                  <CheckableInputNumber
                    uiParams={{ min: 0, step: 1, precision: 0 }}
                  />
                )}
              </Form.Item>
            </Col>
            <Col sm={8} xs={24}>
              <Form.Item label={`Memory Quota`}>
                {form.getFieldDecorator('quotaMemory', {
                  initialValue: initialValue.quotaMemory,
                  getValueFromEvent: (refId, action, val) => val,
                })(
                  <CheckableInputNumber
                    uiParams={{ min: 0.5, step: 0.5, precision: 1 }}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Card title={'Group Quota'} style={{ marginBottom: 16 }}>
          <Row>
            <Col sm={8} xs={24}>
              <Form.Item label={`CPU Quota`}>
                {form.getFieldDecorator('projectQuotaCpu', {
                  initialValue: initialValue.projectQuotaCpu,
                  getValueFromEvent: (refId, action, val) => val,
                })(
                  <CheckableInputNumber
                    uiParams={{ min: 0.5, step: 0.5, precision: 1 }}
                  />
                )}
              </Form.Item>
            </Col>
            <Col sm={8} xs={24}>
              <Form.Item label={`GPU Quota`}>
                {form.getFieldDecorator('projectQuotaGpu', {
                  initialValue: initialValue.projectQuotaGpu,
                  getValueFromEvent: (refId, action, val) => val,
                })(
                  <CheckableInputNumber
                    uiParams={{ min: 0.5, step: 0.5, precision: 1 }}
                  />
                )}
              </Form.Item>
            </Col>
            <Col sm={8} xs={24}>
              <Form.Item label={`Memory Quota`}>
                {form.getFieldDecorator('projectQuotaMemory', {
                  initialValue: initialValue.projectQuotaMemory,
                  getValueFromEvent: (refId, action, val) => val,
                })(
                  <CheckableInputNumber
                    uiParams={{ min: 0.5, step: 0.5, precision: 1 }}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Card title={'Members'}>
          <UsersRelationTable
            value={relateUsers}
            admins={groupAdmins}
            onChange={handleRelationConnection}
            onAdminChange={handleAdminChange}
          />
        </Card>
        <Form.Item style={{ textAlign: 'right', marginTop: 12 }}>
          <InfuseButton
            type='primary'
            htmlType='submit'
            style={{ marginRight: 16 }}
          >
            {submitText}
          </InfuseButton>
          <InfuseButton onClick={handleCancel}>Cancel</InfuseButton>
        </Form.Item>
      </Form>
    </Skeleton>
  );
}

export default compose(Form.create())(GroupForm);
