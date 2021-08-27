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
  Tooltip,
  Icon,
  Select,
} from 'antd';
import { useHistory } from 'react-router-dom';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { isArray } from 'lodash';
import type { FormComponentProps } from 'antd/lib/form';

import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { UserGroups } from 'queries/User.graphql';

import { GroupsRelationTable } from '../User/UserDetail';
import { BaseImageQuery, SecretsQuery } from './Images.graphql';
import type { Image, Groups } from './types';

export type ImageFormState = Partial<Image> & {
  isBuildByCustomImage: boolean;
  baseImage?: string;
  apt?: string;
  conda?: string;
  pip?: string;
};

type ImageFormProps = FormComponentProps<ImageFormState> & {
  onSubmit?: (data: ImageFormState) => void;
  disableName?: boolean;
  loading?: boolean;
  data?: ImageFormState;
  baseImagesQuery: {
    loading: boolean;
    images?: {
      id: string;
      name: string;
      displayName: string;
      type: string;
      url: string;
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
  ...props
}: ImageFormProps) {
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  const [enabledSelectSecret, setEnabledSelectSecret] = React.useState(false);
  const [enabledSpecifyURL, setEnabledSpecifyURL] = React.useState(false);
  const [globalStatus, setGlobalStatus] = React.useState(false);
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
                initialValue: '',
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
                initialValue: '',
              })(<Input />)}
            </Form.Item>

            <Form.Item label='Description'>
              {form.getFieldDecorator('description', {
                initialValue: '',
              })(<Input />)}
            </Form.Item>

            <Form.Item>
              <Radio.Group
                value={toggleRadioGroup}
                onChange={event => setToggleRadioGroup(event.target.value)}
              >
                <Radio value='existingOne'>Use Existing One</Radio>
                <Radio value='customImage'>Build Custom Image</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label='Type'>
              {form.getFieldDecorator('type', {
                initialValue: 'global',
                rules: [
                  {
                    required: true,
                  },
                ],
              })(
                <Select>
                  <Select.Option value='cpu'>CPU</Select.Option>
                  <Select.Option value='gpu'>GPU</Select.Option>
                  <Select.Option value='global'>Universal</Select.Option>
                </Select>
              )}
            </Form.Item>

            <Form.Item label='Image Pull Secret'>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <Checkbox
                  checked={enabledSelectSecret}
                  onChange={event =>
                    setEnabledSelectSecret(event.target.checked)
                  }
                />
                {form.getFieldDecorator('useImagePullSecret', {
                  initialValue: '',
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

            {toggleRadioGroup === 'existingOne' && (
              <>
                <Form.Item label='Container Image URL'>
                  {form.getFieldDecorator('url', {
                    initialValue: '',
                  })(<Input />)}
                </Form.Item>

                <Form.Item label='Specific Container Image URL for GPU'>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <Checkbox
                      checked={enabledSpecifyURL}
                      onChange={event =>
                        setEnabledSpecifyURL(event.target.checked)
                      }
                    />
                    {form.getFieldDecorator('urlForGpu', {
                      initialValue: '',
                    })(<Input disabled={!enabledSpecifyURL} />)}
                  </div>
                </Form.Item>
              </>
            )}

            {toggleRadioGroup === 'customImage' && (
              <>
                <Form.Item label='Base Image URL'>
                  {form.getFieldDecorator('baseImage', {
                    rules: [
                      {
                        required: true,
                        message: 'BaseImage is required',
                      },
                    ],
                    initialValue: '',
                  })(
                    <Select loading={baseImagesQuery.loading}>
                      {baseImagesQuery?.images?.map(image => (
                        <Select.Option key={image.id}>
                          {image.name}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>

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
                        })(
                          <Input.TextArea rows={5} placeholder={placeholder} />
                        )}
                      </Form.Item>
                    </Col>
                  </Row>
                </Form.Item>
              </>
            )}
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
              <Tooltip
                placement='right'
                title={
                  <div>
                    When Global, everyone can access this Instance Type.
                    <a
                      href='https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature'
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
            </label>
            {form.getFieldDecorator('global', {
              valuePropName: 'checked',
              initialValue: false,
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
              Create
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
  graphql(BaseImageQuery, {
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
