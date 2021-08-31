import * as React from 'react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Spin,
  Radio,
  Row,
  Col,
  Switch,
  Select,
} from 'antd';
import { useHistory } from 'react-router-dom';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { isArray } from 'lodash';
import type { FormComponentProps } from 'antd/lib/form';

import PHTooltip from 'components/share/toolTip';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { UserGroups } from 'queries/User.graphql';
import BaseImageRow from 'components/images/baseImageRow';

import { GroupsRelationTable } from '../User/UserDetail';
import { BaseImagesQuery, SecretsQuery } from './images.graphql';
import type { Image, Groups } from './types';

export type ImageFormState = Partial<Image> & {
  isBuildByCustomImage?: boolean;
  baseImage?: string;
  apt?: string;
  conda?: string;
  pip?: string;
};

type ImageFormProps = FormComponentProps<ImageFormState> & {
  onSubmit?: (data: ImageFormState) => void;
  disabledName?: boolean;
  loading?: boolean;
  data?: ImageFormState;
  baseImagesQuery: {
    loading: boolean;
    images?: {
      id: string;
      name: string;
      displayName: string;
      groupName: string;
      useImagePullSecret: string;
      type: string;
      url: string;
      urlForGpu: string;
      description: string;
      isReady: boolean;
    }[];
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

  const [hasData, setHasData] = React.useState(false);
  const [enabledSelectSecret, setEnabledSelectSecret] = React.useState(false);
  const [enabledURLForGpu, setEnabledURLForGpu] = React.useState(false);
  const [globalStatus, setGlobalStatus] = React.useState(false);
  const [pullSecret, setPullSecret] = React.useState('');
  const [toggleRadioGroup, setToggleRadioGroup] =
    React.useState<'existingOne' | 'customImage'>('existingOne');

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

  React.useEffect(() => {
    if (data) {
      setHasData(true);

      // setting radio option and set image pull secret
      if (data?.imageSpec) {
        setToggleRadioGroup('customImage');

        if (data.imageSpec.pullSecret) {
          setPullSecret(data.imageSpec.pullSecret);
          setEnabledSelectSecret(true);
        }
      } else {
        if (data.useImagePullSecret) {
          setPullSecret(data.useImagePullSecret);
          setEnabledSelectSecret(true);
        }
      }

      if (data?.urlForGpu) {
        setEnabledURLForGpu(true);
      }

      if (data?.global) {
        setGlobalStatus(data.global);
      }

      if (data?.groups.length > 0) {
        dispatchUserGroups({ type: 'GROUPS', groups: data.groups });
      }
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

          form.validateFields((err, values: ImageFormState) => {
            if (err) {
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
                isBuildByCustomImage: toggleRadioGroup === 'customImage',
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
        <Spin spinning={props?.loading || false}>
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
                disabled={hasData}
              >
                <Radio value='existingOne'>Use Existing One</Radio>
                <Radio value='customImage'>Build Custom Image</Radio>
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
                <Select>
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

            {toggleRadioGroup === 'customImage' && (
              <BaseImageRow
                form={form}
                imageSpec={data?.imageSpec}
                availableImages={baseImagesQuery?.images}
              />
            )}

            {toggleRadioGroup === 'customImage' ||
              (data?.imageSpec === null && (
                <Form.Item label='Package(s)' required>
                  <Row gutter={16}>
                    <Col span={8}>
                      APT
                      <Form.Item>
                        {form.getFieldDecorator('apt', {
                          rules: [
                            {
                              required: true,
                              message: 'APT is required',
                            },
                          ],
                          initialValue:
                            data?.imageSpec?.packages.apt.join('\n') || '',
                        })(
                          <Input.TextArea rows={5} placeholder={placeholder} />
                        )}
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      Conda
                      <Form.Item>
                        {form.getFieldDecorator('conda', {
                          rules: [
                            {
                              required: true,
                              message: 'Conda is required',
                            },
                          ],
                          initialValue:
                            data?.imageSpec?.packages.conda.join('\n') || '',
                        })(
                          <Input.TextArea rows={5} placeholder={placeholder} />
                        )}
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      Pip
                      <Form.Item>
                        {form.getFieldDecorator('pip', {
                          rules: [
                            {
                              required: true,
                              message: 'Pip is required',
                            },
                          ],
                          initialValue:
                            data?.imageSpec?.packages.pip.join('\n') || '',
                        })(
                          <Input.TextArea rows={5} placeholder={placeholder} />
                        )}
                      </Form.Item>
                    </Col>
                  </Row>
                </Form.Item>
              ))}
          </div>

          <Form.Item>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Global{' '}
              <PHTooltip
                tipText='When Global, everyone can access this Instance Type.'
                tipLink='https://docs.primehub.io/docs/guide_manual/admin-instancetype#edit-groups'
                placement='right'
              />
            </label>
            {form.getFieldDecorator('global', {
              valuePropName: 'checked',
              initialValue: data?.global || false,
            })(
              <Switch
                data-testid='Global'
                checkedChildren='Yes'
                unCheckedChildren='No'
                onChange={value => setGlobalStatus(value)}
                style={{ width: '60px' }}
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
        </Spin>
      </Form>
    </>
  );
}

export const ImageForm = compose(
  graphql(UserGroups, {
    name: 'userGroupsQuery',
    options: () => {
      return {
        fetchPolicy: 'cache-and-network',
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
