import React from 'react';
import { compose } from 'recompose';
import { Row, Col, Form, Input, Switch, Icon, Card, InputNumber } from 'antd';
import { WrappedFormUtils } from 'antd/es/form';
import PHTooltip from 'components/share/toolTip';
import Feature, { FeatureEE } from 'components/share/feature';
import CheckableInputNumber from 'cms-components/customize-number-checkbox';
import InfuseButton from 'components/infuseButton';

export interface GroupInput {
  name: string;
  displayName: string;
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
}

const defaultGroupValue: GroupInput = {
  name: '',
  displayName: '',
  enabledSharedVolume: false,
  enabledDeployment: false,
  launchGroupOnly: false,
  sharedVolumeCapacity: 1,
  maxDeploy: null,
  quotaCpu: 0.5,
  quotaGpu: 0.5,
  quotaMemory: null,
  projectQuotaCpu: null,
  projectQuotaGpu: null,
  projectQuotaMemory: null,
};

interface Props {
  onSubmit: (data: GroupInput) => void;
  onCancel: () => void;
  initialValue?: GroupInput;
  form: WrappedFormUtils;
}

function GroupForm(props: Props) {
  const { form, onSubmit, onCancel } = props;
  const initialValue: GroupInput = props.initialValue || defaultGroupValue;
  const handleSubmit = e => {
    e.preventDefault();
    form.validateFields(async (err, values) => {
      if (err) return;
      onSubmit(values);
    });
  };
  const handleCancel = e => {
    e.preventDefault();
    onCancel();
  };

  return (
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
        })(<Input />)}
      </Form.Item>
      <Form.Item label={'Display Name'}>
        {form.getFieldDecorator('name', {
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
              checkedChildren={<Icon type='check' />}
              unCheckedChildren={<Icon type='close' />}
            />
          )}
        </Form.Item>
      </Feature>
      {form.getFieldValue('enabledSharedVolume') ? (
        <Card title={'Shared Volume'}>
          <Row>
            <Col sm={8} xs={24}>
              <Form.Item label={`Shared Volume Capacity`}>
                {form.getFieldDecorator('sharedVolumeCapacity', {
                  initialValue: initialValue.sharedVolumeCapacity,
                })(
                  <InputNumber
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
                  uiParams={{ min: 0.5, step: 0.5, precision: 1 }}
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
      <Form.Item style={{ textAlign: 'right', marginTop: 12 }}>
        <InfuseButton
          type='primary'
          htmlType='submit'
          style={{ marginRight: 16 }}
        >
          Create
        </InfuseButton>
        <InfuseButton onClick={handleCancel}>Cancel</InfuseButton>
      </Form.Item>
    </Form>
  );
}

export default compose(Form.create())(GroupForm);
