import React, { useEffect, useState, useReducer } from 'react';
import styled from 'styled-components';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Radio,
  Row,
  Col,
  Switch,
  Select,
  Modal,
  Tabs,
} from 'antd';
import { useHistory } from 'react-router-dom';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { get } from 'lodash';
import type { FormComponentProps } from 'antd/lib/form';

import BaseImageRow from 'components/images/baseImageRow';
import PHTooltip from 'components/share/toolTip';
import Log from 'components/share/log';
import { UserGroups } from 'queries/User.graphql';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { errorHandler } from 'utils/errorHandler';

import { GroupsRelationTable } from '../User/UserDetail';
import { BaseImagesQuery, SecretsQuery } from './images.graphql';
import type { Image, ImageSpec, Groups } from './types';

const StyledFormItem = styled<any>(Form.Item)`
  > .ant-form-item-label label {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  > .ant-form-item-label label:after {
    content: '';
  }
`;

export type ImageFormState = Partial<Image> & {
  isBuildByCustomImage?: boolean;
  baseImage?: string;
  pullSecret?: string;
  apt?: string;
  conda?: string;
  pip?: string;
};

type ImageFormProps = FormComponentProps<ImageFormState> & {
  onSubmit?: (data: ImageFormState) => void;
  onRebuild?: (data: ImageSpec) => void;
  onCancelBuild?: (id: string) => void;
  disabledName?: boolean;
  loading?: boolean;
  data?: ImageFormState;
  baseImagesQuery: {
    loading: boolean;
    images?: Partial<Image>[];
  };
  secretsQuery: {
    loading: boolean;
    secrets?: {
      id: string;
      name: string;
      type: string;
    }[];
  };
};

const placeholder = `one package per line. e.g.
package1
package2
`;

function getImageStatus(image: Pick<Image, 'isReady' | 'jobStatus'>) {
  const messages = {
    Succeeded: 'View build details',
    Failed: 'Image build failed',
    Cancelled: 'Image build cancelled',
  };

  const { phase } = image.jobStatus;

  if (!messages[phase]) {
    return 'Image building in progess...';
  }

  if (image.isReady && phase === 'Succeeded') {
    return messages['Succeeded'];
  }

  return messages[phase];
}

function getIsImageReady(image?: Pick<Image, 'jobStatus'>) {
  if (!image?.jobStatus) {
    return false;
  }

  switch (image.jobStatus.phase) {
    case 'Succeeded':
    case 'Failed':
    case 'Cancelled':
      return true;
    default:
      return false;
  }
}

function invalidatePackages({ form }: FormComponentProps<ImageFormState>) {
  const { apt, conda, pip } = form.getFieldsValue();

  if (!apt && !pip && !conda) {
    form.setFields({
      apt: {
        errors: [new Error('You must input at least one package.')],
      },
      pip: {
        errors: [new Error('')],
      },
      conda: {
        errors: [new Error('')],
      },
    });

    return true;
  }

  form.setFields({
    apt: {
      value: apt,
      errors: null,
    },
    pip: {
      value: pip,
      errors: null,
    },
    conda: {
      value: conda,
      errors: null,
    },
  });

  return false;
}

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

function _ImageForm({
  form,
  baseImagesQuery,
  secretsQuery,
  data,
  ...props
}: ImageFormProps) {
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  const [enabledSelectSecret, setEnabledSelectSecret] = useState(false);
  const [enabledURLForGpu, setEnabledURLForGpu] = useState(false);
  const [buildDetailVisible, setBuildDetailVisible] = useState(false);
  const [pullSecret, setPullSecret] = useState('');
  const [toggleRadioGroup, setToggleRadioGroup] =
    useState<'existingOne' | 'customImage'>('existingOne');

  const [userGroups, dispatchUserGroups] = useReducer(
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

  const isImageReady = getIsImageReady({
    jobStatus: data?.jobStatus,
  });

  function handleRelationConnection(actions) {
    if (Array.isArray(actions) && actions.length > 0) {
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

  useEffect(() => {
    if (data?.imageSpec) {
      setToggleRadioGroup('customImage');
      // If it's the custom image use `pullImage`, otherwise use `useImagePullSecret`
      if (data.imageSpec.pullSecret) {
        setPullSecret(data.imageSpec.pullSecret);
        setEnabledSelectSecret(true);
      }
    } else {
      if (data?.useImagePullSecret) {
        setPullSecret(data.useImagePullSecret);
        setEnabledSelectSecret(true);
      }
    }

    if (data?.urlForGpu) {
      setEnabledURLForGpu(true);
    }

    if (data?.groups?.length > 0) {
      dispatchUserGroups({ type: 'GROUPS', groups: data.groups });
    }
  }, [data]);

  return (
    <>
      <Button
        icon='arrow-left'
        style={{ width: '95px' }}
        onClick={() => {
          history.push(`${appPrefix}admin/image`);
        }}
      >
        Back
      </Button>

      <Form
        style={{ backgroundColor: '#ffffff', marginTop: '8px' }}
        onSubmit={event => {
          event.preventDefault();

          const isBuildByCustomImage = toggleRadioGroup === 'customImage';

          form.validateFields((err, values: ImageFormState) => {
            if (err || (isBuildByCustomImage && invalidatePackages({ form }))) {
              return;
            }

            if (props?.onSubmit) {
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
                isBuildByCustomImage,
                useImagePullSecret: enabledSelectSecret
                  ? values.useImagePullSecret
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Form.Item label='Name'>
            {form.getFieldDecorator('name', {
              initialValue: data?.name || '',
              validateFirst: true,
              rules: [
                {
                  required: true,
                  message: 'Name is required',
                },
                {
                  pattern: /^[a-zA-Z0-9][a-zA-Z0-9\s-_]*/,
                  message: `Alphanumeric characters, '-' or '_' , and must start with an alphanumeric character.`,
                },
              ],
            })(<Input disabled={props?.disabledName || false} />)}
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
            <Radio.Group
              value={toggleRadioGroup}
              onChange={event => setToggleRadioGroup(event.target.value)}
              disabled={!!data}
            >
              <Radio data-testid='existing-one' value='existingOne'>
                Use Existing One
              </Radio>
              <Radio data-testid='custom-image' value='customImage'>
                Build Custom Image
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label='Type'>
            {form.getFieldDecorator('type', {
              initialValue: data?.type || 'both',
              rules: [
                {
                  required: true,
                },
              ],
            })(
              <Select data-testid='type'>
                <Select.Option value='cpu'>CPU</Select.Option>
                <Select.Option value='gpu'>GPU</Select.Option>
                <Select.Option value='both'>Universal</Select.Option>
              </Select>
            )}
          </Form.Item>

          {toggleRadioGroup === 'existingOne' && (
            <>
              <Form.Item label='Container Image URL'>
                {form.getFieldDecorator('url', {
                  initialValue: data?.url || '',
                })(<Input />)}
              </Form.Item>

              {form.getFieldValue('type') === 'both' && (
                <Form.Item label='Specific Container Image URL for GPU'>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <Checkbox
                      checked={enabledURLForGpu}
                      onChange={event =>
                        setEnabledURLForGpu(event.target.checked)
                      }
                    />
                    {form.getFieldDecorator('urlForGpu', {
                      initialValue: data?.urlForGpu || '',
                    })(<Input disabled={!enabledURLForGpu} />)}
                  </div>
                </Form.Item>
              )}

              <Form.Item label='Image Pull Secret'>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <Checkbox
                    data-testid='enabled-useImagePullSecret'
                    checked={enabledSelectSecret}
                    onChange={event =>
                      setEnabledSelectSecret(event.target.checked)
                    }
                  />
                  {form.getFieldDecorator('useImagePullSecret', {
                    initialValue: pullSecret || '',
                  })(
                    <Select
                      placeholder='Select Secret'
                      disabled={!enabledSelectSecret}
                      loading={secretsQuery.loading}
                      data-testid='useImagePullSecret'
                    >
                      {secretsQuery?.secrets?.map(secret => (
                        <Select.Option key={secret.id} value={secret.id}>
                          {secret.name}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </div>
              </Form.Item>
            </>
          )}

          {/* For creating a custom image */}
          {toggleRadioGroup === 'customImage' && !data && (
            <>
              <BaseImageRow
                form={form}
                availableImages={baseImagesQuery?.images}
              />
              <Form.Item label='Package(s)' required>
                <Row gutter={16}>
                  <Col span={8}>
                    APT
                    <Form.Item>
                      {form.getFieldDecorator('apt', {
                        initialValue:
                          data?.imageSpec?.packages.apt.join('\n') || '',
                      })(<Input.TextArea rows={4} placeholder={placeholder} />)}
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    Conda
                    <Form.Item>
                      {form.getFieldDecorator('conda', {
                        initialValue:
                          data?.imageSpec?.packages.conda.join('\n') || '',
                      })(<Input.TextArea rows={4} placeholder={placeholder} />)}
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    Pip
                    <Form.Item>
                      {form.getFieldDecorator('pip', {
                        initialValue:
                          data?.imageSpec?.packages.pip.join('\n') || '',
                      })(<Input.TextArea rows={4} placeholder={placeholder} />)}
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </>
          )}

          {/* custom image */}
          {data?.imageSpec && (
            <StyledFormItem
              label={
                <>
                  Conatiner Image URL:{' '}
                  <a onClick={() => setBuildDetailVisible(true)}>
                    {getImageStatus({
                      isReady: data?.isReady,
                      jobStatus: data?.jobStatus,
                    })}
                  </a>
                </>
              }
            >
              {form.getFieldDecorator('url', {
                initialValue: data?.url || '',
              })(<Input disabled />)}

              {form.getFieldDecorator('baseImage', {
                initialValue: data?.imageSpec.baseImage || '',
              })(<Input hidden />)}
              {form.getFieldDecorator('pullSecret', {
                initialValue: data?.imageSpec.pullSecret || '',
              })(<Input hidden />)}
            </StyledFormItem>
          )}
        </div>

        <StyledFormItem
          label={
            <>
              Global{' '}
              <PHTooltip
                tipText='When Global, everyone can access this Instance Type.'
                tipLink='https://docs.primehub.io/docs/guide_manual/admin-instancetype#edit-groups'
                placement='right'
              />
            </>
          }
        >
          {form.getFieldDecorator('global', {
            valuePropName: 'checked',
            initialValue: get(data, 'global', true),
          })(
            <Switch
              data-testid='global'
              checkedChildren='Yes'
              unCheckedChildren='No'
              style={{ width: '60px' }}
            />
          )}
        </StyledFormItem>

        {!form.getFieldValue('global') && (
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

        <div
          style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}
        >
          {/* @ts-ignore */}
          <Button type='primary' htmlType='submit'>
            Confirm
          </Button>
          <Button
            onClick={() => {
              history.push(`${appPrefix}admin/image`);
            }}
          >
            Cancel
          </Button>
        </div>
      </Form>

      {data?.imageSpec && (
        <Modal
          centered
          width='calc(100% - 130px)'
          footer={null}
          visible={buildDetailVisible}
          onCancel={() => setBuildDetailVisible(false)}
        >
          <div>
            <Tabs defaultActiveKey='details'>
              <Tabs.TabPane tab='Build Details' key='details'>
                <BaseImageRow
                  form={form}
                  imageSpec={data?.imageSpec}
                  disabled={!data?.isReady}
                  availableImages={baseImagesQuery?.images}
                />

                <Form.Item label='Status' style={{ marginBottom: '12px' }}>
                  <Input disabled value={data?.jobStatus?.phase || 'Unknow'} />
                </Form.Item>

                <Form.Item label='Package(s)' required>
                  <Row gutter={24}>
                    <Col span={8}>
                      <Form.Item label='APT' style={{ marginBottom: '10px' }}>
                        {form.getFieldDecorator('apt', {
                          initialValue:
                            data?.imageSpec.packages.apt.join('\n') || '',
                        })(
                          <Input.TextArea disabled={!isImageReady} rows={4} />
                        )}
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label='Conda' style={{ marginBottom: '10px' }}>
                        {form.getFieldDecorator('conda', {
                          initialValue:
                            data?.imageSpec.packages.conda.join('\n') || '',
                        })(
                          <Input.TextArea disabled={!isImageReady} rows={4} />
                        )}
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label='Pip' style={{ marginBottom: '10px' }}>
                        {form.getFieldDecorator('pip', {
                          initialValue:
                            data?.imageSpec.packages.pip.join('\n') || '',
                        })(
                          <Input.TextArea disabled={!isImageReady} rows={4} />
                        )}
                      </Form.Item>
                    </Col>
                  </Row>
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab='Log' key='log'>
                <Log endpoint={data?.logEndpoint} />
              </Tabs.TabPane>
            </Tabs>
            <Form.Item style={{ textAlign: 'right', marginTop: 12 }}>
              {isImageReady ? (
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'flex-end',
                  }}
                >
                  {/* @ts-ignore */}
                  <Button
                    type='primary'
                    onClick={() => {
                      if (props?.onRebuild) {
                        form.validateFields((err, values: ImageFormState) => {
                          const { apt, conda, pip } = values;

                          if (err || invalidatePackages({ form })) {
                            return;
                          }

                          const imageSpec: ImageSpec = {
                            baseImage: values.baseImage,
                            pullSecret: values.pullSecret,
                            // @ts-ignore
                            packages: {},
                          };

                          if (apt.length > 0) {
                            imageSpec.packages['apt'] = apt.split('\n');
                          }

                          if (conda.length > 0) {
                            imageSpec.packages['conda'] = conda.split('\n');
                          }

                          if (pip.length > 0) {
                            imageSpec.packages['pip'] = pip.split('\n');
                          }

                          props.onRebuild(imageSpec);

                          setBuildDetailVisible(false);
                        });
                      }
                    }}
                  >
                    Rebuild
                  </Button>
                  <Button onClick={() => setBuildDetailVisible(false)}>
                    Close
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'flex-end',
                  }}
                >
                  {/* @ts-ignore */}
                  <Button
                    type='primary'
                    onClick={() => setBuildDetailVisible(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      Modal.confirm({
                        title: 'Cancel Build',
                        content:
                          'Are you sure you want to cancel building this custom image?',
                        okText: 'Confirm',
                        cancelText: 'Back',
                        onOk: () => {
                          if (props?.onCancelBuild) {
                            props.onCancelBuild(data.id);
                            setBuildDetailVisible(false);
                          }
                        },
                        cancelButtonProps: {
                          style: {
                            float: 'right',
                            marginLeft: 8,
                          },
                        },
                      });
                    }}
                  >
                    Cancel Build
                  </Button>
                </div>
              )}
            </Form.Item>
          </div>
        </Modal>
      )}
    </>
  );
}

export const ImageForm = compose(
  graphql(UserGroups, {
    name: 'userGroupsQuery',
    options: () => {
      return {
        fetchPolicy: 'cache-and-network',
        onError: errorHandler,
      };
    },
  }),
  graphql(BaseImagesQuery, {
    name: 'baseImagesQuery',
    options: () => {
      return {
        variables: {
          where: {},
        },
      };
    },
  }),
  graphql(SecretsQuery, {
    name: 'secretsQuery',
  })
)(
  Form.create<ImageFormProps>({
    name: 'instance-type-form',
  })(_ImageForm)
);
