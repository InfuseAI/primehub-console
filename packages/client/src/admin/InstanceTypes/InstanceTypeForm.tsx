import * as React from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  Icon,
  Popconfirm,
  Spin,
  Switch,
  Table,
  Tabs,
  Tooltip,
} from 'antd';

import { TolerationModalForm } from './TolerationModalForm';
import type { TInstanceType, TToleration } from './types';

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
      placement="right"
      title={
        <div>
          {instructions[type].text}{' '}
          <a
            href={instructions[type].link}
            target="_blank"
            rel="noopener"
            style={{ color: '#839ce0' }}
          >
            Learn More.
          </a>
        </div>
      }
    >
      <Icon type="question-circle" />
    </Tooltip>
  );
}

type FormState = Pick<
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
  | 'tolerations'
  | 'nodeSelector'
>;

export const initialFormState: FormState = {
  id: '',
  name: '',
  displayName: '',
  description: '',
  cpuLimit: 0,
  gpuLimit: 0,
  memoryLimit: 0,
  cpuRequest: 0,
  memoryRequest: 0,
  global: false,
  tolerations: [],
  nodeSelector: null,
};

interface InstanceTypeFormProps
  extends Omit<UseFormReturn<FormState>, 'reset'> {
  onSubmit?: (data: Partial<FormState>) => Promise<void>;
  disableName?: boolean;
  loading?: boolean;
}

type AdvanceFeatureState = {
  enableCpuRequest: boolean;
  enableMemoryRequest: boolean;
};

type AdvanceFeatureAction =
  | { type: 'cpu'; value: boolean }
  | { type: 'memory'; value: boolean };

export function InstanceTypeForm({
  loading = false,
  ...props
}: InstanceTypeFormProps) {
  const [activePanel, setActivePanel] = React.useState('1');
  const [advanceFeature, dispatch] = React.useReducer(
    (state: AdvanceFeatureState, action: AdvanceFeatureAction) => {
      switch (action.type) {
        case 'cpu':
          return {
            ...state,
            enableCpuRequest: action.value,
          };
        case 'memory':
          return {
            ...state,
            enableMemoryRequest: action.value,
          };
      }
    },
    {
      enableCpuRequest: false,
      enableMemoryRequest: false,
    }
  );

  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editToleration, setEditToleration] = React.useState<TToleration>(null);
  const [tolerModalFormAction, setTolerModalFormAction] =
    React.useState<'create' | 'update'>(null);

  const { control, getValues, setValue } = props;

  function onUpdateToleration() {
    const currentTolerations = getValues('tolerations');

    const nextTolerations = currentTolerations.map((toleraction, id) => {
      if (editToleration.id === id) {
        return editToleration;
      }
      return toleraction;
    });

    setValue('tolerations', nextTolerations);
    setEditToleration(null);
    setTolerModalFormAction(null);
    setEditModalVisible(false);
  }

  function onCreateToleration() {
    const currentTolerations = getValues('tolerations');
    const nextTolerations = [...currentTolerations, editToleration];

    setValue('tolerations', nextTolerations);
    setEditToleration(null);
    setTolerModalFormAction(null);
    setEditModalVisible(false);
  }

  return (
    <form style={{ backgroundColor: '#ffffff' }}>
      <Tabs activeKey={activePanel} onTabClick={(tab) => setActivePanel(tab)}>
        <Tabs.TabPane tab="Basic Info" key="1">
          <Spin spinning={loading}>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label htmlFor="instance-type-name">Name</label>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      id="instance-type-name"
                      value={value}
                      onChange={onChange}
                      disabled={props?.disableName || false}
                    />
                  )}
                />
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label htmlFor="instance-type-display-name">Display Name</label>
                <Controller
                  control={control}
                  name="displayName"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      id="instance-type-display-name"
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label htmlFor="instance-type-description">Description</label>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      id="instance-type-description"
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label htmlFor="instance-type-cpu-limit">
                  CPU Limit <Tips type="cpuLimit" />
                </label>
                <Controller
                  control={control}
                  name="cpuLimit"
                  render={({ field: { onChange, value } }) => (
                    <InputNumber
                      id="instance-type-cpu-limit"
                      min={0}
                      precision={1}
                      step={0.5}
                      formatter={(value) => `${value}GB`}
                      parser={(value) => value.replace(/([A-Z]+.*)/, '')}
                      value={value}
                      onChange={onChange}
                      style={{ width: '105px' }}
                    />
                  )}
                />
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label htmlFor="instance-type-memory-limit">
                  Memory Limit <Tips type="memoryLimit" />
                </label>
                <Controller
                  control={control}
                  name="memoryLimit"
                  render={({ field: { onChange, value } }) => (
                    <InputNumber
                      id="instance-type-memory-limit"
                      min={0}
                      precision={1}
                      step={0.5}
                      formatter={(value) => `${value}GB`}
                      parser={(value) => value.replace(/([A-Z]+.*)/, '')}
                      value={value}
                      onChange={onChange}
                      style={{ width: '105px' }}
                    />
                  )}
                />
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label htmlFor="instance-type-gpu-limit">
                  GPU Limit <Tips type="gpuLimit" />
                </label>
                <Controller
                  control={control}
                  name="gpuLimit"
                  render={({ field: { onChange, value } }) => (
                    <InputNumber
                      id="instance-type-gpu-limit"
                      min={0}
                      precision={1}
                      step={0.5}
                      value={value}
                      onChange={onChange}
                      style={{ width: '105px' }}
                    />
                  )}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4>Overcommitting (advanced feature)</h4>
                <p>
                  If you want to overcommit computing resources, you can use
                  this feature.{' '}
                  <a
                    href="https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature"
                    target="_blank"
                    rel="noopener"
                  >
                    More Info
                  </a>
                </p>
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label htmlFor="instance-type-cpu-request">
                  CPU Request <Tips type="cpuRequest" />
                </label>
                <div>
                  <Checkbox
                    checked={advanceFeature.enableCpuRequest}
                    onChange={() =>
                      dispatch({
                        type: 'cpu',
                        value: !advanceFeature.enableCpuRequest,
                      })
                    }
                  />
                  <Controller
                    control={control}
                    name="cpuRequest"
                    render={({ field: { onChange } }) => (
                      <InputNumber
                        id="instance-type-cpu-request"
                        min={0}
                        step={0.5}
                        defaultValue={0}
                        onChange={onChange}
                        disabled={!advanceFeature.enableCpuRequest}
                        style={{ marginLeft: '8px', width: '130px' }}
                      />
                    )}
                  />
                </div>
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label htmlFor="instance-type-memory-request">
                  Memory Request <Tips type="memoryRequest" />
                </label>
                <div>
                  <Checkbox
                    checked={advanceFeature.enableMemoryRequest}
                    onChange={() =>
                      dispatch({
                        type: 'memory',
                        value: !advanceFeature.enableMemoryRequest,
                      })
                    }
                  />
                  <Controller
                    control={control}
                    name="memoryRequest"
                    render={({ field: { onChange } }) => (
                      <InputNumber
                        id="instance-type-memory-request"
                        min={0}
                        precision={1}
                        defaultValue={0}
                        step={0.5}
                        formatter={(value) =>
                          value || advanceFeature.enableMemoryRequest
                            ? `${value}GB`
                            : null
                        }
                        parser={(value) => value.replace(/([A-Z]+.*)/, '')}
                        onChange={onChange}
                        disabled={!advanceFeature.enableMemoryRequest}
                        style={{ marginLeft: '8px', width: '130px' }}
                      />
                    )}
                  />
                </div>
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label htmlFor="instance-type-global">
                  Global <Tips type="global" />
                </label>
                <Controller
                  control={control}
                  name="global"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      defaultChecked={value}
                      onChange={onChange}
                      checkedChildren="Yes"
                      unCheckedChildren="No"
                      style={{ width: '60px' }}
                    />
                  )}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  icon="arrow-right"
                  onClick={() =>
                    setActivePanel((prev) => String(Number(prev) + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </Spin>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Tolerations" key="2">
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '16px',
            }}
          >
            <Button
              type="primary"
              icon="plus"
              onClick={() => {
                setTolerModalFormAction('create');
                setEditModalVisible(true);
              }}
            >
              Create Toleration
            </Button>
          </div>

          <Controller
            control={control}
            name="tolerations"
            render={({ field: { value: tolerations, onChange } }) => (
              <Table
                loading={loading}
                pagination={false}
                rowKey={(data) => data.key}
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
                    render: (value) => value.value ?? '-',
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
                            <Icon type="edit" />
                          </Button>
                          <Popconfirm
                            title="Are you sure delete this task?"
                            onConfirm={() => {
                              const currentTolerations =
                                getValues('tolerations');
                              const nextTolerations = currentTolerations.filter(
                                (_, id) => id !== editToleration.id
                              );

                              onChange(nextTolerations);
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
                              <Icon type="delete" />
                            </Button>
                          </Popconfirm>
                        </Button.Group>
                      );
                    },
                  },
                ]}
              />
            )}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '16px',
              gap: '8px',
            }}
          >
            <Button
              icon="arrow-left"
              onClick={() => setActivePanel((prev) => String(Number(prev) - 1))}
            >
              Back
            </Button>
            <Button
              icon="arrow-right"
              onClick={() => setActivePanel((prev) => String(Number(prev) + 1))}
            >
              Next
            </Button>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Node Selector" key="3">
          C
          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}
          >
            <Button>Cancel</Button>
            <Button type="primary">Save</Button>
          </div>
        </Tabs.TabPane>
      </Tabs>

      <TolerationModalForm
        type="update"
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
    </form>
  );
}
