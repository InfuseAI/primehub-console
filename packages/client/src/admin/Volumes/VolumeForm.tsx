import * as React from 'react';
import { Link } from 'react-router-dom';
import { Select, Input, Icon, InputNumber, Form, Row, Col, Switch } from 'antd';
import { get } from 'lodash';
import { appPrefix } from 'utils/env';

import { VolumePvProvisioning, VolumeType, TVolume, TVolumeForm } from './types';
import EnvVariables from './EnvVariables';
import { FormComponentProps } from 'antd/lib/form/Form';
import InfuseButton from 'components/infuseButton';
import EnableUploadServer from './EnableUploadServer';
import { GitSecret } from './GitSecret';
import { VolumeGroupsRelationTable } from './VolumeGroupsRelationTable';
import { MountRoot } from './MountRoot';
import styled from 'styled-components';
import PHTooltip from 'components/share/toolTip';

const StyledFormItem = styled<any>(Form.Item)`
  > .ant-form-item-label label:after {
    content: '';
  }
`;

interface Props extends FormComponentProps {
  onSubmit?: (data: Partial<TVolumeForm>) => Promise<void>;
  initialValue: TVolume;
  editMode?: boolean;
}

const StyledForm = styled(Form)`
  .ant-form-item-label {
    margin-bottom: -4px;
  }
  .ant-form-item {
    margin-bottom: 10px;
  }
`;

function _VolumeForm(props: Props) {
  const { editMode, form } = props;
  const initialValue = {
    description: '',
    ...props.initialValue,
  };

  const handleSubmit = async (e) => {
    const { form, onSubmit, editMode } = props;
    e.preventDefault();

    form.validateFields(async (err, values: Partial<TVolumeForm>) => {
      if (err) return;
      const data: Partial<TVolumeForm> = {};

      data.name = values.name;
      if (form.isFieldTouched('displayName'))
        data.displayName = values.displayName;
      if (!editMode || form.isFieldTouched('description'))
        data.description = values.description;
      if (form.isFieldTouched('type'))
        data.type = values.type;
      if (form.isFieldTouched('enableUploadServer'))
        data.enableUploadServer = values.enableUploadServer;
      if (form.isFieldTouched('global'))
        data.global = values.global;
      if (form.isFieldTouched('groups'))
        data.groups = values.groups;

      if (values.type === 'pv') {
        if (!editMode) {
          data.pvProvisioning = values.pvProvisioning;
          data.volumeSize = values.volumeSize;
        }
      } else if (values.type === 'nfs') {
        data.nfsServer = values.nfsServer;
        data.nfsPath = values.nfsPath;
      } else if (values.type === 'hostPath') {
        data.hostPath = values.hostPath;
      } else if (values.type === 'gitSync') {
        data.url = values.url;
        if (form.isFieldTouched('secret'))
          data.secret = values.secret;
      } else if (values.type === 'env') {
        data.variables = values.variables;
      }

      onSubmit(data);
    });
  }

  const renderPvVolume = () => {
    const name = form.getFieldValue('name') || initialValue?.name;
    const pvProvisioning = form.getFieldValue('pvProvisioning') || initialValue?.pvProvisioning;

    return (
      <>
        <div data-testid='volume/pvProvisioning'>
          <Form.Item label='Provisioning'>
            {form.getFieldDecorator('pvProvisioning', {
              initialValue: initialValue?.pvProvisioning,
              rules: [
                {
                  required: true,
                  message: 'Please select a provising type.',
                },
              ],
            })(
              <Select disabled={editMode} style={{width: '200px'}} >
                <Select.Option value="auto">auto</Select.Option>
                <Select.Option value="manual">manual</Select.Option>
              </Select>
            )}
          </Form.Item>
        </div>

        {!editMode ? null : (
          <div data-testid='volume/volumeName'>
            <Form.Item label='Volume Name'>
              <Input disabled value={name} />
            </Form.Item>
          </div>)
        }

        {pvProvisioning !== VolumePvProvisioning.AUTO ? null : (
          <div data-testid='volume/volumeSize'>
            <Form.Item label='Volume Size'>
              {form.getFieldDecorator('volumeSize', {
                initialValue: initialValue?.volumeSize || 1,
                rules: [
                  {
                    required: true,
                    message: 'Please select a provising type.',
                  },
                ],
              })(
              <InputNumber
                  disabled={editMode}
                  style={{ width: 150 }}
                  formatter={(value) => (value == -1 ? `-` : `${value} GB`)}
                  parser={(value) => value.replace(/[^0-9\.]/g, '')}
                  step={1}
                  min={1}
                />
              )}
            </Form.Item>
          </div>)
        }
      </>);
  }

  const renderNfsVolume = () => {
    return (
      <>
        <div data-testid='volume/nfsServer'>
          <Form.Item label={`NFS Server`}>
            {form.getFieldDecorator('nfsServer', {
              initialValue: initialValue?.nfsServer,
              rules: [
                {
                  required: true,
                  validator: (rule, value, cb) => {
                    if (!value.match(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)) {
                      cb(`please provide a domain or an ip.`);
                    } else {
                      cb();
                    }
                  },
                }
              ],
            })(<Input placeholder='1.2.3.4'/>)}
          </Form.Item>
        </div>

        <div data-testid='volume/nfsPath'>
          <Form.Item label={`NFS Path`}>
            {form.getFieldDecorator('nfsPath', {
              initialValue: initialValue?.nfsPath,
              rules: [
                {
                  required: true,
                  validator: (rule, value, cb) => {
                    if (!value.match(/^\/|\/\/|(\/[\w-]+)+$/)) {
                      cb(`please provide a correct path string.`);
                    } else {
                      cb();
                    }
                  },
                }
              ],
            })(<Input placeholder='/data'/>)}
          </Form.Item>
        </div>
      </>);
  }

  const renderHostPathVolume = () => {
    return (
      <>
        <div data-testid='volume/hostPath'>
          <Form.Item label={`Host Path`}>
            {form.getFieldDecorator('hostPath', {
              initialValue: initialValue?.hostPath,
              rules: [
                {
                  required: true,
                  validator: (rule, value, cb) => {
                    if (!value) {
                      cb(`please provide a correct path string.`);
                    }
                    if (!value.match(/^\/|\/\/|(\/[\w-]+)+$/)) {
                      cb(`please provide a correct path string.`);
                    }
                    cb();
                  },
                },
              ],
            })(<Input placeholder='/data'/>)}
          </Form.Item>
        </div>
      </>);
  }

  const renderGitVolume = () => {
    return (
      <>
        <div data-testid='volume/url'>
          <Form.Item label={`URL`}>
            {form.getFieldDecorator('url', {
              initialValue: initialValue?.url,
              rules: [
                {
                  required: true,
                  message: 'Please input the git repository url!',
                },
              ],
            })(<Input />)}
          </Form.Item>
        </div>

        <div data-testid='volume/secret'>
          <Form.Item label={`Secret`}>
            {form.getFieldDecorator('secret', {
              initialValue: {},
            })(<GitSecret initialValue={initialValue?.secret} />)}
          </Form.Item>
        </div>
      </>);
  }

  const renderEnvVolume = () => {
    return (
      <>
        <div data-testid='volume/variables'>
          <Form.Item label={`Variables`}>
            {form.getFieldDecorator('variables', {
              initialValue: initialValue?.variables || {},
              rules: [
                {
                  validator: (rule, value, cb) => {
                    Object.keys(value).forEach((key) => {
                      if (!key.match(/^[a-zA-Z_]+[a-zA-Z0-9_]*$/)) {
                        cb(`The key should be alphanumeric charcter, '_', and must start with a letter.`);
                      }
                    });
                    cb();
                  },
                },
              ],
            })(<EnvVariables />)}
          </Form.Item>
        </div>
      </>);
  }

  const type = form.getFieldValue('type') || initialValue?.type;
  const name = form.getFieldValue('name') || initialValue?.name;

  let typeSepcificItems = null;
  let allowWritable = false;
  let mountRootVisible = false;
  let enableUpdateServerVisible = false;
  if (type === VolumeType.PV) {
    typeSepcificItems = renderPvVolume();
    allowWritable = true;
    mountRootVisible = true;
    enableUpdateServerVisible = true;
  } else if (type === VolumeType.NFS) {
    typeSepcificItems = renderNfsVolume();
    allowWritable = true;
    mountRootVisible = true;
    enableUpdateServerVisible = true;
  } else if (type === VolumeType.HOSTPATH) {
    typeSepcificItems = renderHostPathVolume();
    allowWritable = true;
    mountRootVisible = true;
    enableUpdateServerVisible = true;
  } else if (type === VolumeType.GIT) {
    typeSepcificItems = renderGitVolume();
  } else if (type === VolumeType.ENV) {
    typeSepcificItems = renderEnvVolume();
  }

  return (
    <div data-testid='volume'>
      <InfuseButton>
        <Link to={`${appPrefix}admin/volume`}><Icon type='arrow-left' /> Back</Link>
      </InfuseButton>
      <StyledForm onSubmit={handleSubmit}>
        <Row>
          <Col>
            <div data-testid='volume/name'>
              <Form.Item label='Name'>
                {form.getFieldDecorator('name', {
                  initialValue: initialValue?.name,
                  rules: [
                    {
                      required: true,
                      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
                      message: `lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`,
                    }
                  ],
                })(<Input data-testid='volume/input-name' disabled={editMode} />)}
              </Form.Item>
            </div>

            <div data-testid='volume/displayName'>
              <Form.Item label={`Display Name`}>
                {form.getFieldDecorator('displayName', {
                  initialValue: initialValue?.displayName,
                })(<Input data-testid='volume/input-displayName' />)}
              </Form.Item>
            </div>

            <div data-testid='volume/description'>
              <Form.Item label='Description'>
                {form.getFieldDecorator('description', {
                  initialValue: initialValue?.description,
                })(<Input data-testid='volume/input-description' />)}
              </Form.Item>
            </div>

            { editMode && mountRootVisible &&
              <div data-testid='volume/mountRoot'>
                <Form.Item label='Mount Root'>
                  <MountRoot name={name} />
                </Form.Item>
              </div>
            }

            <StyledFormItem
              label={
                <span>
                  Global{' '}
                  <PHTooltip
                    tipText='When Global, everyone can access this Volume.'
                    tipLink='https://docs.primehub.io/docs/guide_manual/admin-volume#groups-access-control'
                    placement='right'
                  />
                </span>
              }
            >
              {form.getFieldDecorator('global', {
                valuePropName: 'checked',
                initialValue: get(initialValue, 'global', true),
              })(<Switch unCheckedChildren='No' data-testid='volume/global' />)}
            </StyledFormItem>

            <div data-testid='volume/displayName'>
              <Form.Item label='Type'>
                {form.getFieldDecorator('type', {
                  initialValue: initialValue?.type,
                  rules: [
                    {
                      required: true,
                      message: 'Please select a type.',
                    },
                  ],
                })(
                  <Select disabled={editMode} style={{width: '200px'}} placeholder='Select an item'>
                    <Select.Option value="pv">Persistent Volume</Select.Option>
                    <Select.Option value="nfs">NFS</Select.Option>
                    <Select.Option value="hostPath">Host Path</Select.Option>
                    <Select.Option value="gitSync">Git Sync</Select.Option>
                    <Select.Option value="env">Env</Select.Option>
                  </Select>
                )}
              </Form.Item>
            </div>
            {typeSepcificItems}

            {editMode && enableUpdateServerVisible &&
              <div data-testid='volume/enableUploadServer'>
                <Form.Item label='Enable Upload Server'>
                  {form.getFieldDecorator('enableUploadServer', {
                    initialValue: initialValue?.enableUploadServer || false,
                  })(
                    <EnableUploadServer name={name} allowRegenerateSecret={initialValue?.enableUploadServer} />
                  )}
                </Form.Item>
              </div>
            }

            <div data-testid='volume/groups'>
              {form.getFieldDecorator('groups', {
                initialValue: {},
              })(
                <VolumeGroupsRelationTable
                  groups={initialValue?.groups}
                  allowWritable={allowWritable}
                  allowReadOnly={!form.getFieldValue('global')}
                />
              )}
            </div>

            <Form.Item style={{textAlign: 'right', marginTop: 12}}>
              <InfuseButton
                data-testid='confirm-button'
                type='primary'
                htmlType='submit'
                style={{marginRight: 16}}
              >
                Confirm
              </InfuseButton>
              <InfuseButton data-testid='reset-button'>
              <Link to={`${appPrefix}admin/volume`}>Cancel</Link>
              </InfuseButton>
            </Form.Item>
          </Col>
        </Row>
      </StyledForm>
    </div>
  );
}

export const VolumeForm =  Form.create<Props>()(_VolumeForm);
