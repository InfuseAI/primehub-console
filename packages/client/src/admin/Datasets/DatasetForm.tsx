import * as React from 'react';
import { Link } from 'react-router-dom';
import { Select, Input, Tooltip, Icon, Divider, InputNumber, Form, Row, Card, Col } from 'antd';
import { appPrefix } from 'utils/env';

import { DatasetPvProvisioning, DatasetType, TDataset, TDatasetForm } from './types';
import EnvVariables from './EnvVariables';
import { FormComponentProps } from 'antd/lib/form/Form';
import InfuseButton from 'components/infuseButton';
import EnableUploadServer from './EnableUploadServer';
import { GitSecret } from './GitSecret';
import { useEffect, useState } from 'react';
import { get } from 'lodash';
import { DatasetGroupsRelationTable } from './DatasetGroupsRelationTable';

interface Props extends FormComponentProps {
  onSubmit?: (data: Partial<TDatasetForm>) => Promise<void>;
  initialValue: TDataset;
  editMode?: boolean;
}

function _DatasetForm(props: Props) {
  const { editMode, initialValue, form } = props;

  const handleSubmit = async (e) => {
    const { form, onSubmit, editMode } = props;
    e.preventDefault();

    form.validateFields(async (err, values: Partial<TDatasetForm>) => {
      if (err) return;
      const data: Partial<TDatasetForm> = {};

      data.name = values.name;
      if (form.isFieldTouched('displayName'))
        data.displayName = values.displayName;
      if (form.isFieldTouched('description'))
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
      } else if (values.type === 'git') {
        data.url = values.url;
        if (form.isFieldTouched('secret'))
          data.secret = values.secret;
      } else if (values.type === 'env') {
        data.variables = values.variables;
      }

      onSubmit(data);
    });
  }

  const renderPvDataset = () => {
    const name = form.getFieldValue('name') || initialValue?.name;
    const pvProvisioning = form.getFieldValue('pvProvisioning') || initialValue?.pvProvisioning;

    return (
      <>
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

        {!editMode ? null : (
          <Form.Item label='Volume Name'>
            <Input disabled value={name} />
          </Form.Item>)
        }

        {pvProvisioning !== DatasetPvProvisioning.AUTO ? null : (
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
                style={{ width: 250 }}
                formatter={(value) => (value == -1 ? `-` : `${value} GB`)}
                parser={(value) => value.replace(/[^0-9\.]/g, '')}
                step={1}
                min={1}
              />
            )}
          </Form.Item>)
        }

        {!editMode ? null :
          <Form.Item label='Enable Upload Server'>
            {form.getFieldDecorator('enableUploadServer', {
              initialValue: initialValue?.enableUploadServer || false,
            })(
              <EnableUploadServer name={name} allowRegenerateSecret={initialValue?.enableUploadServer} />
            )}
          </Form.Item>
        }
      </>);
  }

  const renderNfsDataset = () => {
    return (
      <>
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
      </>);
  }

  const renderHostPathDataset = () => {
    return (
      <>
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
      </>);
  }

  const renderGitDataset = () => {
    return (
      <>
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
        <Form.Item label={`Secret`}>
          {form.getFieldDecorator('secret', {
            initialValue: {},
          })(<GitSecret initialValue={initialValue?.secret} />)}
        </Form.Item>
      </>);
  }

  const renderEnvDataset = () => {
    return (
      <>
        <Form.Item label={`Variables`}>
          {form.getFieldDecorator('variables', {
            initialValue: initialValue?.variables || {},
            rules: [
              {
                validator: (rule, value, cb) => {
                  Object.keys(value).forEach((key) => {
                    console.log(key);
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
      </>);
  }

  const type = form.getFieldValue('type') || initialValue?.type || 'pv';

  let typeSepcificItems = null;
  if (type === DatasetType.PV) {
    typeSepcificItems = renderPvDataset();
  } else if (type === DatasetType.NFS) {
    typeSepcificItems = renderNfsDataset();
  } else if (type === DatasetType.HOSTPATH) {
    typeSepcificItems = renderHostPathDataset();
  } else if (type === DatasetType.GIT) {
    typeSepcificItems = renderGitDataset();
  } else if (type === DatasetType.ENV) {
    typeSepcificItems = renderEnvDataset();
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col>
          <Form.Item label={`Name`}>
            {form.getFieldDecorator('name', {
              initialValue: initialValue?.name,
              rules: [
                {
                  required: true,
                  pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
                  message: `lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`,
                }
              ],
            })(<Input disabled={editMode} />)}
          </Form.Item>
          <Form.Item label={`Display Name`}>
            {form.getFieldDecorator('displayName', {
              initialValue: initialValue?.displayName,
            })(<Input />)}
          </Form.Item>
          <Form.Item label='Description'>
            {form.getFieldDecorator('description', {
              initialValue: initialValue?.description,
            })(<Input />)}
          </Form.Item>
          <Divider />
          <Form.Item label='Type'>
            {form.getFieldDecorator('type', {
              initialValue: initialValue?.type || 'pv',
              rules: [
                {
                  required: true,
                  message: 'Please select a type.',
                },
              ],
            })(
              <Select disabled={editMode} style={{width: '200px'}} >
                <Select.Option value="pv">Persistent Volume</Select.Option>
                <Select.Option value="nfs">NFS</Select.Option>
                <Select.Option value="hostPath">Host Path</Select.Option>
                <Select.Option value="git">Git</Select.Option>
                <Select.Option value="env">Env</Select.Option>
              </Select>
            )}
          </Form.Item>
          {typeSepcificItems}
          <Form.Item label={`Groups`}>
            {form.getFieldDecorator('groups', {
              initialValue: {},
            })(<DatasetGroupsRelationTable groups={initialValue?.groups} />)}
          </Form.Item>
          <Form.Item style={{textAlign: 'right', marginTop: 12}}>
            <InfuseButton
              type='primary'
              htmlType='submit'
              style={{marginRight: 16}}
            >
              Confirm
            </InfuseButton>
            <InfuseButton>
            <Link to={`${appPrefix}admin/dataset`}>Cancel</Link>
            </InfuseButton>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}

export const DatasetForm =  Form.create<Props>()(_DatasetForm);
