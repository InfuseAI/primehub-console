import * as React from 'react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Icon,
  Popconfirm,
  Spin,
  Switch,
  Table,
  Tabs,
  Tooltip,
  notification,
} from 'antd';
import { useHistory } from 'react-router-dom';
import { omit, get, isArray } from 'lodash';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import type { FormComponentProps } from 'antd/lib/form';

import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { UserGroups } from 'queries/User.graphql';

import { GroupsRelationTable } from '../User/UserDetail';
import { NodeSelectorList } from './NodeSelectorList';
import { TolerationModalForm } from './TolerationModalForm';
import type { TInstanceType, TToleration, Groups } from './types';

function Tips({
  type,
}: {
  type:
    | 'cpuLimit'
    | 'memoryLimit'
    | 'gpuLimit'
    | 'cpuRequest'
    | 'memoryRequest'
    | 'global';
}) {
  const instructions = {
    cpuLimit: {
      text: 'Define how many CPU are allowed to use by this Instance Type. The value is also applied to CPU Request when CPU Request is disabled.',
      link: 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#creating-new-instance-types',
    },
    memoryLimit: {
      text: 'Define how many memory are allowed to use by this Instance Type. The value also applied to Memory Request when Memory Request is disabled.',
      link: 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#creating-new-instance-types',
    },
    gpuLimit: {
      text: 'Define how many GPU can be used by this Instance Type. GPU can only be integer.',
      link: 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#creating-new-instance-types',
    },
    cpuRequest: {
      text: 'When enabled, instances are guaranteed to gain the amount of CPU they request. If CPU Request < CPU Limit, the system will try to overcommit CPU resources within the limit if more resources are available.',
      link: 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature',
    },
    memoryRequest: {
      text: 'When enabled, instances are guaranteed to get the amount of Memory they request. If Memory Request < Memory Limit, the system will try to overcommit Memory resources within the limit if more resources are available.',
      link: 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature',
    },
    global: {
      text: 'When Global, everyone can access this Instance Type.',
      link: 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature',
    },
  };

  return (
    <Tooltip
      placement='right'
      title={
        <div>
          {instructions[type].text}{' '}
          <a
            href={instructions[type].link}
            target='_blank'
            rel='noopener'
            style={{ color: '#839ce0' }}
          >
            Learn More.
          </a>
        </div>
      }
    >
      <Icon type='question-circle' />
    </Tooltip>
  );
}

export type InstanceTypeFormState = Pick<
  TInstanceType,
  | 'id'
  | 'name'
  | 'displayName'
  | 'description'
  | 'cpuLimit'
  | 'gpuLimit'
  | 'memoryLimit'
  | 'cpuRequest'
  | 'memoryRequest'
  | 'global'
  | 'groups'
  | 'tolerations'
  | 'nodeSelector'
>;

type InstanceTypeFormProps = FormComponentProps<InstanceTypeFormState> & {
  onSubmit?: (data: InstanceTypeFormState) => void;
  disableName?: boolean;
  loading?: boolean;
  data?: TInstanceType;
};

type AdvanceFeatureState = {
  enableCpuRequest: boolean;
  enableMemoryRequest: boolean;
};

type AdvanceFeatureAction =
  | { type: 'CPU'; enabled: boolean }
  | { type: 'MEMORY'; enabled: boolean };

type UserGroupsState = {
  groups: Groups[];
  connections: {
    connect: Groups[];
    disconnect: Groups[];
  };
};

type UserGroupsAction =
  | { type: 'GROUPS'; groups: Groups[] }
  | { type: 'CONNECTIONS'; connect: Groups[]; disconnect: Groups[] };

export function _InstanceTypeForm({
  loading = false,
  form,
  data,
  ...props
}: InstanceTypeFormProps) {
  const [activePanel, setActivePanel] = React.useState('1');
  const [tolerations, setTolerations] = React.useState([]);
  const [nodeList, setNodeList] = React.useState<string[][]>([]);
  const [globalStatus, setGlobalStatus] = React.useState(false);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editToleration, setEditToleration] = React.useState<TToleration>(null);
  const [tolerModalFormAction, setTolerModalFormAction] =
    React.useState<'create' | 'update'>(null);

  const [advanceFeature, dispatchAdanceFeature] = React.useReducer(
    (state: AdvanceFeatureState, action: AdvanceFeatureAction) => {
      switch (action.type) {
        case 'CPU':
          return {
            ...state,
            enableCpuRequest: action.enabled,
          };
        case 'MEMORY':
          return {
            ...state,
            enableMemoryRequest: action.enabled,
          };
      }
    },
    {
      enableCpuRequest: false,
      enableMemoryRequest: false,
    }
  );

  const [userGroups, dispatchUserGroups] = React.useReducer(
    (state: UserGroupsState, action: UserGroupsAction) => {
      switch (action.type) {
        case 'GROUPS':
          return {
            ...state,
            groups: action.groups,
          };

        case 'CONNECTIONS': {
          const nextUserGroups = [
            ...state.groups.filter(
              group => !action.disconnect.map(d => d.id).includes(group.id)
            ),
            ...action.connect,
          ];

          return {
            ...state,
            groups: nextUserGroups,
            connections: {
              connect: action.connect,
              disconnect: action.disconnect,
            },
          };
        }
      }
    },
    {
      groups: [],
      connections: {
        connect: [],
        disconnect: [],
      },
    }
  );

  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  React.useEffect(() => {
    if (data) {
      if (data?.tolerations.length > 0) {
        const tolerations = data.tolerations.map(t => omit(t, ['__typename']));
        setTolerations(tolerations);
      }

      if (data?.groups.length > 0) {
        dispatchUserGroups({ type: 'GROUPS', groups: data.groups });
      }

      if (data?.cpuRequest) {
        dispatchAdanceFeature({ type: 'CPU', enabled: true });
      }

      if (data?.memoryRequest) {
        dispatchAdanceFeature({ type: 'MEMORY', enabled: true });
      }

      if (data?.nodeSelector) {
        setNodeList(Object.entries(data.nodeSelector));
      }

      setGlobalStatus(data.global);
    }
  }, [data]);

  function onUpdateToleration() {
    const nextTolerations = tolerations.map((toleraction, id) => {
      if (editToleration.id === id) {
        return editToleration;
      }
      return toleraction;
    });

    setTolerations(nextTolerations);
    setEditToleration(null);
    setTolerModalFormAction(null);
    setEditModalVisible(false);
  }

  function onCreateToleration() {
    const nextTolerations = [...tolerations, editToleration];

    setTolerations(nextTolerations);
    setEditToleration(null);
    setTolerModalFormAction(null);
    setEditModalVisible(false);
  }

  function handleRelationConnection(actions) {
    if (isArray(actions) && actions.length > 0) {
      const connect = [];
      const disconnect = [];

      actions.filter(action => {
        if (action.type === 'connect') {
          connect.push(action.value);
        }
        if (action.type === 'disconnect') {
          disconnect.push(action.value);
        }
      });

      dispatchUserGroups({
        type: 'CONNECTIONS',
        connect,
        disconnect,
      });
    }
  }

  return (
    <>
      <Button
        icon='arrow-left'
        style={{ width: '95px' }}
        onClick={() => {
          history.push(`${appPrefix}admin/instanceType`);
        }}
      >
        Back
      </Button>
      <Form
        style={{ backgroundColor: '#ffffff', marginTop: '8px' }}
        onSubmit={event => {
          event.preventDefault();

          form.validateFields((err, values: InstanceTypeFormState) => {
            if (err) {
              let errorMessages = '';
              Object.keys(err).map(key => {
                errorMessages += `${get(err, `${key}.errors[0].message`)}\n`;
              });

              notification.error({
                duration: 5,
                placement: 'bottomRight',
                message: `Failure`,
                description: errorMessages,
              });

              return;
            }

            if (props?.onSubmit) {
              // Edit Groups `connect` and `disconnect`
              const connect = userGroups.connections.connect
                .filter(c =>
                  userGroups.groups.map(({ id }) => id).includes(c.id)
                )
                .map(({ id }) => ({ id }));

              const disconnect = userGroups.connections.disconnect
                .filter(
                  c => !userGroups.groups.map(({ id }) => id).includes(c.id)
                )
                .map(({ id }) => ({ id }));

              props.onSubmit({
                ...values,
                cpuRequest: advanceFeature.enableCpuRequest
                  ? values.cpuRequest
                  : null,
                memoryRequest: advanceFeature.enableMemoryRequest
                  ? values.memoryRequest
                  : null,
                groups: {
                  // @ts-ignore
                  connect,
                  disconnect,
                },
              });
            }
          });
        }}
      >
        <Tabs activeKey={activePanel} onTabClick={tab => setActivePanel(tab)}>
          {/* Basic */}
          <Tabs.TabPane tab='Basic Info' key='1'>
            <Spin spinning={loading}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Form.Item label='Name'>
                  {form.getFieldDecorator('name', {
                    initialValue: data?.name || '',
                    rules: [
                      {
                        required: !props?.disableName || false,
                        message: 'Name is required',
                      },
                    ],
                  })(<Input disabled={props?.disableName || false} />)}
                </Form.Item>

                <Form.Item label='Display Name'>
                  {form.getFieldDecorator('displayName', {
                    initialValue: data?.displayName || '',
                  })(<Input />)}
                </Form.Item>

                <Form.Item label='Description'>
                  {form.getFieldDecorator('description', {
                    initialValue: data?.description || '',
                  })(<Input />)}
                </Form.Item>

                <Form.Item>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    CPU Limit <Tips type='cpuLimit' />
                  </label>

                  {form.getFieldDecorator('cpuLimit', {
                    initialValue: data?.cpuLimit || 1,
                  })(
                    <InputNumber
                      data-testid='CPU Limit'
                      min={0}
                      precision={1}
                      step={0.5}
                      // @ts-ignore
                      parser={value => value.replace(/[^0-9.]/g, '')}
                      style={{ width: '105px' }}
                    />
                  )}
                </Form.Item>

                <Form.Item>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Memory Limit <Tips type='memoryLimit' />
                  </label>

                  {form.getFieldDecorator('memoryLimit', {
                    initialValue: data?.memoryLimit || 1,
                  })(
                    <InputNumber
                      data-testid='Memory Limit'
                      min={0}
                      precision={1}
                      step={1}
                      formatter={value => `${value} GB`}
                      // @ts-ignore
                      parser={value => value.replace(/[^0-9.]/g, '')}
                      style={{ width: '105px' }}
                    />
                  )}
                </Form.Item>

                <Form.Item>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    GPU Limit <Tips type='gpuLimit' />
                  </label>

                  {form.getFieldDecorator('gpuLimit', {
                    initialValue: data?.gpuLimit || 0,
                  })(
                    <InputNumber
                      data-testid='GPU Limit'
                      min={0}
                      step={1}
                      style={{ width: '105px' }}
                    />
                  )}
                </Form.Item>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4>Overcommitting (advanced feature)</h4>
                  <p>
                    If you want to overcommit computing resources, you can use
                    this feature.{' '}
                    <a
                      href='https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature'
                      target='_blank'
                      rel='noopener'
                    >
                      More Info
                    </a>
                  </p>
                </div>

                <Form.Item>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    CPU Request <Tips type='cpuRequest' />
                  </label>
                  <div>
                    <Checkbox
                      data-testid='enabled-cpuRequest'
                      checked={advanceFeature.enableCpuRequest}
                      onChange={() =>
                        dispatchAdanceFeature({
                          type: 'CPU',
                          enabled: !advanceFeature.enableCpuRequest,
                        })
                      }
                    />
                    {form.getFieldDecorator('cpuRequest', {
                      initialValue: data?.cpuRequest || 0.5,
                    })(
                      <InputNumber
                        min={0}
                        step={0.5}
                        disabled={!advanceFeature.enableCpuRequest}
                        formatter={value => {
                          if (advanceFeature.enableCpuRequest) {
                            if (value === '') {
                              return '0';
                            }
                            return String(value);
                          }

                          return null;
                        }}
                        style={{ marginLeft: '8px', width: '130px' }}
                      />
                    )}
                  </div>
                </Form.Item>

                <Form.Item>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Memory Request <Tips type='memoryRequest' />
                  </label>
                  <div>
                    <Checkbox
                      data-testid='enabled-memoryRequest'
                      checked={advanceFeature.enableMemoryRequest}
                      onChange={() =>
                        dispatchAdanceFeature({
                          type: 'MEMORY',
                          enabled: !advanceFeature.enableMemoryRequest,
                        })
                      }
                    />
                    {form.getFieldDecorator('memoryRequest', {
                      initialValue: data?.memoryRequest || 1,
                    })(
                      <InputNumber
                        min={0}
                        precision={1}
                        step={1}
                        formatter={value => {
                          if (advanceFeature.enableMemoryRequest) {
                            if (value === '') {
                              return '0 GB';
                            }
                            return `${value} GB`;
                          }

                          return null;
                        }}
                        // @ts-ignore
                        parser={value => value.replace(/[^0-9.]/g, '')}
                        disabled={!advanceFeature.enableMemoryRequest}
                        style={{ marginLeft: '8px', width: '130px' }}
                      />
                    )}
                  </div>
                </Form.Item>

                <Form.Item>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Global <Tips type='global' />
                  </label>
                  {form.getFieldDecorator('global', {
                    valuePropName: 'checked',
                    initialValue: globalStatus,
                  })(
                    <Switch
                      data-testid='Global'
                      checkedChildren='Yes'
                      unCheckedChildren='No'
                      style={{ width: '60px' }}
                      onChange={value => setGlobalStatus(value)}
                    />
                  )}
                </Form.Item>

                {!globalStatus && (
                  <Form.Item>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Groups
                    </label>
                    <GroupsRelationTable
                      value={userGroups.groups}
                      onChange={handleRelationConnection}
                    />
                  </Form.Item>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    icon='arrow-right'
                    onClick={() =>
                      setActivePanel(prev => String(Number(prev) + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Spin>
          </Tabs.TabPane>

          {/* Tolerations */}
          <Tabs.TabPane tab='Tolerations' key='2'>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '16px',
              }}
            >
              {/* @ts-ignore */}
              <Button
                type='primary'
                icon='plus'
                onClick={() => {
                  setTolerModalFormAction('create');
                  setEditModalVisible(true);
                }}
              >
                Create Toleration
              </Button>
            </div>

            {form.getFieldDecorator('tolerations', {
              initialValue: tolerations,
            })(
              <Table
                loading={loading}
                pagination={false}
                rowKey={data => data.key}
                dataSource={tolerations}
                columns={[
                  {
                    key: 'key',
                    title: 'Key',
                    dataIndex: 'key',
                  },
                  {
                    key: 'value',
                    title: 'Value',
                    render: value => value.value ?? '-',
                  },
                  {
                    key: 'operator',
                    title: 'Operator',
                    dataIndex: 'operator',
                  },
                  {
                    key: 'effect',
                    title: 'Effect',
                    dataIndex: 'effect',
                  },
                  {
                    key: 'actions',
                    title: 'Actions',
                    render: function Actions(_, value, id) {
                      return (
                        <Button.Group>
                          <Button
                            onClick={() => {
                              setTolerModalFormAction('update');
                              setEditModalVisible(true);
                              setEditToleration({
                                ...value,
                                id,
                              });
                            }}
                          >
                            <Icon type='edit' />
                          </Button>
                          <Popconfirm
                            title='Are you sure delete this task?'
                            onConfirm={() => {
                              const nextTolerations = tolerations.filter(
                                (_, id) => id !== editToleration.id
                              );

                              setTolerations(nextTolerations);
                              setEditToleration(null);
                            }}
                          >
                            <Button
                              onClick={() => {
                                setEditToleration({
                                  ...value,
                                  id,
                                });
                              }}
                            >
                              <Icon type='delete' />
                            </Button>
                          </Popconfirm>
                        </Button.Group>
                      );
                    },
                  },
                ]}
              />
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '16px',
                gap: '8px',
              }}
            >
              <Button
                icon='arrow-left'
                onClick={() => setActivePanel(prev => String(Number(prev) - 1))}
              >
                Basic Info
              </Button>
              <Button
                icon='arrow-right'
                onClick={() => setActivePanel(prev => String(Number(prev) + 1))}
              >
                Next
              </Button>
            </div>
          </Tabs.TabPane>

          {/* Node Selector */}
          <Tabs.TabPane tab='Node Selector' key='3'>
            {form.getFieldDecorator('nodeSelector', {
              initialValue: nodeList,
            })(
              <NodeSelectorList
                nodes={nodeList}
                form={form}
                onChange={setNodeList}
              />
            )}

            <div
              style={{
                display: 'flex',
                marginTop: '24px',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <Button
                icon='arrow-left'
                onClick={() => setActivePanel(prev => String(Number(prev) - 1))}
              >
                Tolerations
              </Button>

              <div style={{ display: 'flex', gap: '16px' }}>
                {/* @ts-ignore */}
                <Button type='primary' htmlType='submit'>
                  Confirm
                </Button>
                <Button
                  onClick={() => {
                    history.push(`${appPrefix}admin/instanceType`);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Tabs.TabPane>

          {form.getFieldDecorator('id', {
            initialValue: data?.id,
          })(<Input type='hidden' />)}
        </Tabs>

        <TolerationModalForm
          type={tolerModalFormAction}
          visible={editModalVisible}
          currentToleration={editToleration}
          setToleration={setEditToleration}
          onOk={() => {
            if (tolerModalFormAction === 'create') {
              onCreateToleration();
            }

            if (tolerModalFormAction === 'update') {
              onUpdateToleration();
            }
          }}
          onCancel={() => {
            setEditToleration(null);
            setTolerModalFormAction(null);
            setEditModalVisible(false);
          }}
        />
      </Form>
    </>
  );
}

export const InstanceTypeForm = compose(
  // For edit group
  graphql(UserGroups, {
    name: 'queryUserGroups',
    alias: 'withQueryUserGroups',
    options: () => {
      return {
        fetchPolicy: 'cache-and-network',
      };
    },
  })
)(
  Form.create<InstanceTypeFormProps>({
    name: 'instance-type-form',
  })(_InstanceTypeForm)
);
