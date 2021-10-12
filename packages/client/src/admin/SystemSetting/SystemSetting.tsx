import * as React from 'react';
import moment from 'moment';
import { get, omit } from 'lodash';
import {
  Icon,
  Layout,
  Card,
  Row,
  Col,
  Button,
  Input,
  InputNumber,
  Switch,
  Modal,
  notification,
  Skeleton,
  Form,
} from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { timezones } from 'react-timezone';
import type { FormComponentProps } from 'antd/lib/form';

import Breadcrumbs from 'components/share/breadcrumb';

import { TimeZone } from './Timezone';
import { LicenseStatus, LicenseTag } from './LicenseStatus';
import {
  GetSystemSetting,
  UpdateSystemSetting,
} from './systemSettings.graphql';

function CustomLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        color: 'rgba(0, 0, 0, 0.85)',
        paddingBottom: '8px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PageHead() {
  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 24px',
      }}
    >
      <Breadcrumbs
        pathList={[
          {
            key: 'system',
            matcher: /\/system/,
            title: 'System Settings',
          },
        ]}
      />
    </div>
  );
}

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
const LABEL_WIDTH = { width: '300px' };

const initialState = {
  systemName: '',
  logo: null,
  defaultUserVolumeCapacity: 0,
  timezone: null,
  smtpHost: '',
  smtpPort: null,
  smtpFromDisplayName: '',
  smtpFrom: '',
  smtpReplyDisplayName: '',
  smtpReply: '',
  smtpEnvelopeFrom: '',
  smtpEnableSSL: true,
  smtpEnableStartTLS: false,
  smtpEnableAuth: true,
  smtpUsername: '',
  smtpPassword: '',
};

interface SystemInfo {
  license: {
    startedAt: Date;
    expiredAt: Date;
    maxGroup: number;
    maxNode: number;
    maxModelDeploy: number;
    licensedTo: string;
    licenseStatus: LicenseStatus;
    usage: {
      maxGroup: number;
      maxNode: number;
      maxModelDeploy: number;
    };
  };

  org: {
    name: string;
    logo: {
      url: string;
    };
  };

  defaultUserVolumeCapacity: number;

  timezone: {
    name: string;
    offset: number;
  };

  smtp: {
    host?: string;
    port?: number;
    fromDisplayName?: string;
    from?: string;
    replyToDisplayName?: string;
    replyTo?: string;
    envelopeFrom?: string;
    enableSSL?: boolean;
    enableStartTLS?: boolean;
    enableAuth?: boolean;
    username?: string;
    password?: string;
  };
}

interface Props extends FormComponentProps {
  data: {
    loading: boolean;
    error: undefined | Error;
    system?: SystemInfo;
  };
  updateSystemSetting: ({
    variables,
  }: {
    variables: {
      payload: Omit<SystemInfo, 'license'>;
    };
  }) => Promise<void>;
}

function _SystemSetting({ form, data, ...props }: Props) {
  const [addImageButtonVisible, setAddImageButtonVisible] =
    React.useState(false);
  const [pasteImageModalVisible, setPasteImageModalVisible] =
    React.useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    form.validateFields(async (err, values) => {
      if (err) return;

      const formData = omit(values, 'smtp');

      const smtpData = Object.keys(values.smtp).reduce((acc, k) => {
        if (values.smtp[k] === '') {
          acc[k] = null;
        } else {
          acc[k] = values.smtp[k];
        }

        return acc;
      }, {});

      const { offset } = timezones.find(
        ({ name }) => name === formData.timezone
      );

      try {
        await props.updateSystemSetting({
          variables: {
            payload: {
              org: {
                // If remove logo and no upload a new, after update still get old logo.
                logo: {
                  url: formData.logo,
                },
                name: formData.systemName,
              },

              timezone: {
                name: formData.timezone,
                offset,
              },

              defaultUserVolumeCapacity: formData.defaultUserVolumeCapacity,

              smtp: smtpData,
            },
          },
        });
      } catch (err) {
        console.error(err);

        notification.error({
          duration: 5,
          placement: 'bottomRight',
          message: 'Failure',
          description: 'Failure to update, try again later.',
        });
      }
    });
  }

  React.useEffect(() => {
    if (data?.system) {
      if (!data.system.org.logo?.url) {
        setAddImageButtonVisible(true);
      }
    }
  }, [data]);

  if (data.error) {
    return <div>Error</div>;
  }

  if (data.loading) {
    return (
      <Layout>
        <PageHead />
        <div
          style={{
            margin: '16px',
            padding: '32px',
            backgroundColor: '#fff',
          }}
        >
          <Skeleton active />
        </div>
      </Layout>
    );
  }

  const { license } = data.system;

  return (
    <Layout>
      <PageHead />
      <div
        style={{
          margin: '16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <Form
          id='system-settings'
          onSubmit={onSubmit}
          style={{
            display: 'grid',
            gridRow: 3,
            gap: '24px',
            backgroundColor: '#fff',
          }}
        >
          {__ENV__ !== 'ce' && (
            <Card title='PrimeHub License'>
              <Row type='flex'>
                <Col sm={5} xs={24}>
                  <div>
                    <CustomLabel>License Status</CustomLabel>
                    <LicenseTag
                      data-testid='license-status'
                      status={license.licenseStatus}
                    />
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <CustomLabel>Expiration Date</CustomLabel>
                    <div data-testid='license-expiredAt'>
                      {moment(license.expiredAt).format('YYYY/MM/DD HH:mm')}
                    </div>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <CustomLabel>Licensed To</CustomLabel>
                    <div data-testid='license-to'>{license.licensedTo}</div>
                  </div>
                </Col>
                <Col sm={5} xs={24}>
                  <div>
                    <CustomLabel>Utilized Nodes</CustomLabel>
                    <div data-testid='license-maxNode'>
                      {get(license, 'usage.maxNode', 0)}/
                      {Number(license.maxNode) === -1 ? '∞' : license.maxNode}
                    </div>
                  </div>
                </Col>
                <Col sm={5} xs={24}>
                  <div>
                    <CustomLabel>Deployed Models</CustomLabel>
                    <div data-testid='license-maxDeploy'>
                      {get(license, 'usage.maxModelDeploy', 0)}/
                      {Number(license.maxModelDeploy) === -1
                        ? '∞'
                        : license.maxModelDeploy}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          <Card title='System Settings'>
            <Form.Item label='Name' style={LABEL_WIDTH}>
              {form.getFieldDecorator('systemName', {
                initialValue: get(
                  data,
                  'system.org.name',
                  initialState.systemName
                ),
              })(<Input data-testid='settings-systemName' />)}
            </Form.Item>

            <Form.Item label='Logo' style={LABEL_WIDTH}>
              {addImageButtonVisible ? (
                <>
                  <Button
                    type='primary'
                    data-testid='add-logo'
                    onClick={() => setPasteImageModalVisible(true)}
                  >
                    <Icon type='plus' /> Add Image
                  </Button>
                </>
              ) : (
                <div
                  style={{
                    border: '1px solid #e8e8e8',
                    backgroundColor: 'rgb(238, 238, 238)',
                  }}
                >
                  <img
                    width='100%'
                    alt='Logo'
                    src={
                      form.getFieldValue('logo') ?? data.system.org.logo?.url
                    }
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      padding: '10px 16px',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Button
                      data-testid='remove-logo'
                      onClick={() => {
                        setAddImageButtonVisible(true);
                      }}
                    >
                      <Icon type='close' />
                    </Button>
                  </div>
                </div>
              )}
              <Modal
                title='Choose Image'
                visible={pasteImageModalVisible}
                maskClosable={false}
                onCancel={() => {
                  setPasteImageModalVisible(false);
                  setAddImageButtonVisible(false);

                  form.setFieldsValue({
                    logo: get(data, 'system.org.logo.url', initialState.logo),
                  });
                }}
                onOk={() => {
                  setPasteImageModalVisible(false);
                  setAddImageButtonVisible(false);
                }}
              >
                <Form.Item label='Enter Image URL'>
                  {form.getFieldDecorator('logo', {
                    initialValue: get(
                      data,
                      'system.org.logo.url',
                      initialState.logo
                    ),
                    rules: [
                      {
                        pattern:
                          /(http)?s?:?(\/\/[^"']*\.(?:png|jpg|jpeg|png))/i,
                        message: 'URL is invalid',
                      },
                    ],
                  })(<Input data-testid='settings-logo-url' />)}
                </Form.Item>
              </Modal>
            </Form.Item>

            <Form.Item label='Default User Volume Capacity' style={LABEL_WIDTH}>
              {form.getFieldDecorator('defaultUserVolumeCapacity', {
                initialValue: get(
                  data,
                  'system.defaultUserVolumeCapacity',
                  initialState.defaultUserVolumeCapacity
                ),
              })(
                <InputNumber
                  data-testid='settings-capacity'
                  formatter={value => `${value} GB`}
                  parser={value => value.replace(/[^0-9.]/g, '')}
                  precision={0}
                  min={1}
                  step={1}
                />
              )}
            </Form.Item>

            <Form.Item label='Timezone' style={LABEL_WIDTH}>
              {form.getFieldDecorator('timezone', {
                initialValue: get(data, 'system.timezone.name'),
              })(
                <TimeZone
                  value={form.getFieldValue('timezone')}
                  onChange={nextTimezone => {
                    form.setFieldsValue({ timezone: nextTimezone });
                  }}
                />
              )}
            </Form.Item>
          </Card>

          <Card title='Email Settings'>
            <Form.Item label='SMTP Host' style={LABEL_WIDTH}>
              {form.getFieldDecorator('smtp.host', {
                initialValue: get(
                  data,
                  'system.smtp.host',
                  initialState.smtpHost
                ),
              })(<Input data-testid='smtp-host' />)}
            </Form.Item>

            <Form.Item label='SMTP Port' style={LABEL_WIDTH}>
              {form.getFieldDecorator('smtp.port', {
                initialValue: get(
                  data,
                  'system.smtp.port',
                  initialState.smtpPort
                ),
              })(
                <InputNumber
                  data-testid='smtp-port'
                  precision={0}
                  min={1}
                  step={1}
                />
              )}
            </Form.Item>

            <Form.Item label='From Display Name' style={LABEL_WIDTH}>
              {form.getFieldDecorator('smtp.fromDisplayName', {
                initialValue: get(
                  data,
                  'system.smtp.fromDisplayName',
                  initialState.smtpFromDisplayName
                ),
              })(<Input data-testid='smtp-from-display-name' />)}
            </Form.Item>

            <Form.Item label='From' style={LABEL_WIDTH}>
              {form.getFieldDecorator('smtp.from', {
                initialValue: get(
                  data,
                  'system.smtp.from',
                  initialState.smtpFrom
                ),
                rules: [
                  {
                    pattern: EMAIL_REGEX,
                    message: 'Invalid Email',
                  },
                ],
              })(<Input data-testid='smtp-from' />)}
            </Form.Item>

            <Form.Item label='Reply To Display Name' style={LABEL_WIDTH}>
              {form.getFieldDecorator('smtp.replyToDisplayName', {
                initialValue: get(
                  data,
                  'system.smtp.replyToDisplayName',
                  initialState.smtpReplyDisplayName
                ),
              })(<Input data-testid='smtp-reply-display-name' />)}
            </Form.Item>

            <Form.Item label='Reply' style={LABEL_WIDTH}>
              {form.getFieldDecorator('smtp.replyTo', {
                initialValue: get(
                  data,
                  'system.smtp.replyTo',
                  initialState.smtpReply
                ),
                rules: [
                  {
                    pattern: EMAIL_REGEX,
                    message: 'Invalid Email',
                  },
                ],
              })(<Input data-testid='smtp-reply' />)}
            </Form.Item>

            <Form.Item label='Envelope From' style={LABEL_WIDTH}>
              {form.getFieldDecorator('smtp.envelopeFrom', {
                initialValue: get(
                  data,
                  'system.smtp.envelopeFrom',
                  initialState.smtpEnvelopeFrom
                ),
              })(<Input data-testid='smtp-envelop-from' />)}
            </Form.Item>

            <Form.Item label='Enable SSL'>
              {form.getFieldDecorator('smtp.enableSSL', {
                initialValue: get(
                  data,
                  'system.smtp.enableSSL',
                  initialState.smtpEnableSSL
                ),
                valuePropName: 'checked',
              })(
                <Switch
                  data-testid='smtp-enable-ssl'
                  checkedChildren='Yes'
                  unCheckedChildren='No'
                />
              )}
            </Form.Item>

            <Form.Item label='Enable StartTLS'>
              {form.getFieldDecorator('smtp.enableStartTLS', {
                initialValue: get(
                  data,
                  'system.smtp.enableStartTLS',
                  initialState.smtpEnableStartTLS
                ),
                valuePropName: 'checked',
              })(
                <Switch
                  data-testid='smtp-enable-startTLS'
                  checkedChildren='Yes'
                  unCheckedChildren='No'
                />
              )}
            </Form.Item>

            <Form.Item label='Enable Authentication'>
              {form.getFieldDecorator('smtp.enableAuth', {
                initialValue: get(
                  data,
                  'system.smtp.enableAuth',
                  initialState.smtpEnableAuth
                ),
                valuePropName: 'checked',
              })(
                <Switch
                  data-testid='smtp-enable-auth'
                  checkedChildren='Yes'
                  unCheckedChildren='No'
                />
              )}
            </Form.Item>

            <Form.Item label='Username' style={LABEL_WIDTH}>
              {form.getFieldDecorator('smtp.username', {
                initialValue: get(
                  data,
                  'system.smtp.username',
                  initialState.smtpUsername
                ),
              })(<Input data-testid='smtp-username' />)}
            </Form.Item>

            <Form.Item label='Password' style={LABEL_WIDTH}>
              {form.getFieldDecorator('smtp.password', {
                initialValue: get(
                  data,
                  'system.smtp.password',
                  initialState.smtpPassword
                ),
              })(<Input type='password' />)}
            </Form.Item>
          </Card>
        </Form>

        <div
          style={{
            display: 'flex',
            marginTop: '32px',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={() => {
              form.resetFields();
            }}
            style={{ marginRight: '16px' }}
          >
            Reset
          </Button>
          {/* @ts-ignore */}
          <Button type='primary' htmlType='submit' form='system-settings'>
            Confirm
          </Button>
        </div>
      </div>
    </Layout>
  );
}

export const SystemSetting = compose(
  graphql(UpdateSystemSetting, {
    name: 'updateSystemSetting',
    options: () => ({
      onCompleted: () => {
        notification.success({
          duration: 5,
          placement: 'bottomRight',
          message: 'Save successfully!',
          description: 'Your changes have been saved.',
        });
      },
      onError: () => {
        notification.error({
          duration: 5,
          placement: 'bottomRight',
          message: 'Update failure!',
          description: 'Update failure, try again later.',
        });
      },
    }),
  }),
  graphql(GetSystemSetting, {
    options: () => {
      return {
        fetchPolicy: 'cache-and-network',
      };
    },
  })
)(Form.create({ name: 'system-settings' })(_SystemSetting));
