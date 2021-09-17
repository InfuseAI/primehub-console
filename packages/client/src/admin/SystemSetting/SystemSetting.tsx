import * as React from 'react';
import moment from 'moment';
import { get } from 'lodash';
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
  Typography,
  notification,
  Skeleton,
} from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { Controller, useForm } from 'react-hook-form';
import { timezones } from 'react-timezone';

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

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;

const initialState = {
  systemName: '',
  logo: '',
  defaultUserVolumeCapacity: 0,
  timezone: undefined,
  smtpHost: '',
  smtpPort: undefined,
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
  license?: {
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
    host: string;
    port: number;
    fromDisplayName: string | null;
    from: string;
    replyToDisplayName: string | null;
    replyTo: string | null;
    envelopeFrom: string | null;
    enableSSL: boolean;
    enableStartTLS: boolean;
    enableAuth: boolean;
    username: string;
    password: string;
  };
}

interface Props {
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

function _SystemSetting({ data, ...props }: Props) {
  const [addImageButtonVisible, setAddImageButtonVisible] =
    React.useState(false);
  const [pasteImageModalVisible, setPasteImageModalVisible] =
    React.useState(false);

  const { control, formState, reset, watch, handleSubmit } = useForm({
    defaultValues: initialState,
    mode: 'onChange',
  });

  const watchedURL = watch('logo');

  async function onSubmit(data: typeof initialState) {
    try {
      await props.updateSystemSetting({
        variables: {
          payload: {
            org: {
              logo: {
                url: !formState.errors.logo && data.logo,
              },
              name: data.systemName,
            },

            timezone: {
              name: data.timezone.name,
              offset: data.timezone.offset,
            },

            defaultUserVolumeCapacity: data.defaultUserVolumeCapacity,

            smtp: {
              host: data.smtpHost,
              port: data.smtpPort,
              fromDisplayName: data.smtpFromDisplayName,
              from: data.smtpFrom,
              replyToDisplayName: data.smtpReplyDisplayName,
              replyTo: data.smtpReply,
              envelopeFrom: data.smtpEnvelopeFrom,
              enableSSL: data.smtpEnableSSL,
              enableStartTLS: data.smtpEnableStartTLS,
              enableAuth: data.smtpEnableAuth,
              username: data.smtpUsername,
              password: data.smtpPassword,
            },
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
  }

  React.useEffect(() => {
    // after fetched data, reset form default value
    if (data?.system) {
      reset({
        systemName: data.system.org.name,
        logo: data.system.org.logo?.url,
        defaultUserVolumeCapacity: data.system.defaultUserVolumeCapacity,
        timezone: data.system.timezone,
        smtpHost: data.system.smtp.host,
        smtpPort: data.system.smtp.port,
        smtpFromDisplayName: data.system.smtp.fromDisplayName,
        smtpFrom: data.system.smtp.from,
        smtpReplyDisplayName: data.system.smtp.replyToDisplayName,
        smtpReply: data.system.smtp.replyTo,
        smtpEnvelopeFrom: data.system.smtp.envelopeFrom,
        smtpEnableSSL: data.system.smtp.enableSSL,
        smtpEnableStartTLS: data.system.smtp.enableStartTLS,
        smtpEnableAuth: data.system.smtp.enableAuth,
        smtpUsername: data.system.smtp.username,
        smtpPassword: data.system.smtp.password,
      });
    }
  }, [data, reset]);

  if (data.error) {
    return <div>Error</div>;
  }

  const PageHead = () => (
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

  const { license, defaultUserVolumeCapacity, smtp } = data.system;

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
        <form
          id="system-settings"
          onSubmit={handleSubmit(onSubmit)}
          style={{
            display: 'grid',
            gridRow: 3,
            gap: '24px',
            backgroundColor: '#fff',
          }}
        >
          {__ENV__ === 'ce' ? (
            <></>
          ) : (
            <Card title="PrimeHub License">
              <Row type="flex">
                <Col sm={5} xs={24}>
                  <div>
                    <CustomLabel>License Status</CustomLabel>
                    <LicenseTag
                      data-testid="license-status"
                      status={license.licenseStatus}
                    />
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <CustomLabel>Expiration Date</CustomLabel>
                    <div data-testid="license-expiredAt">
                      {moment(license.expiredAt).format('YYYY/MM/DD HH:mm')}
                    </div>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <CustomLabel>Licensed To</CustomLabel>
                    <div data-testid="license-to">{license.licensedTo}</div>
                  </div>
                </Col>
                <Col sm={5} xs={24}>
                  <div>
                    <CustomLabel>Utilized Nodes</CustomLabel>
                    <div data-testid="license-maxNode">
                      {get(license, 'usage.maxNode', 0)}/
                      {Number(license.maxNode) === -1 ? '∞' : license.maxNode}
                    </div>
                  </div>
                </Col>
                <Col sm={5} xs={24}>
                  <div>
                    <CustomLabel>Deployed Models</CustomLabel>
                    <div data-testid="license-maxDeploy">
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

          <Card title="System Settings">
            <div style={{ width: '300px' }}>
              <CustomLabel>Name</CustomLabel>
              <Controller
                control={control}
                name="systemName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    data-testid="settings-systemName"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Logo</CustomLabel>

              {addImageButtonVisible ? (
                <>
                  {/* @ts-ignore */}
                  <Button
                    type="primary"
                    data-testid="add-logo"
                    onClick={() => setPasteImageModalVisible(true)}
                  >
                    <Icon type="plus" /> Add Image
                  </Button>

                  <Modal
                    title="Choose Image"
                    visible={pasteImageModalVisible}
                    maskClosable={false}
                    onCancel={() => {
                      setPasteImageModalVisible(false);
                      setAddImageButtonVisible(false);

                      // reset to the origin url
                      reset({
                        logo: data.system.org.logo?.url,
                      });
                    }}
                    onOk={() => {
                      setPasteImageModalVisible(false);
                      setAddImageButtonVisible(false);
                    }}
                    okButtonProps={{
                      disabled:
                        !watchedURL || formState.errors.logo ? true : false,
                    }}
                  >
                    <CustomLabel>Enter Image URL</CustomLabel>
                    <Controller
                      control={control}
                      name="logo"
                      rules={{
                        pattern:
                          /(http)?s?:?(\/\/[^"']*\.(?:png|jpg|jpeg|png))/i,
                      }}
                      render={({ field: { value, onChange } }) => (
                        <CustomLabel>
                          <Input
                            data-testid="settings-logo-url"
                            value={value}
                            onChange={onChange}
                          />

                          {formState.errors.logo && (
                            <CustomLabel
                              style={{ marginTop: '8px', padding: 0 }}
                            >
                              <Typography.Text type="danger">
                                Invalid image URL
                              </Typography.Text>
                            </CustomLabel>
                          )}
                        </CustomLabel>
                      )}
                    />
                  </Modal>
                </>
              ) : (
                <div
                  style={{
                    border: '1px solid #e8e8e8',
                    backgroundColor: 'rgb(238, 238, 238)',
                  }}
                >
                  <img width="100%" src={watchedURL} />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      padding: '10px 16px',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Button
                      data-testid="remove-logo"
                      onClick={() => setAddImageButtonVisible(true)}
                    >
                      <Icon type="close" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Default User Volume Capacity</CustomLabel>
              <Controller
                control={control}
                name="defaultUserVolumeCapacity"
                render={({ field: { onChange } }) => (
                  <InputNumber
                    data-testid="settings-capacity"
                    defaultValue={defaultUserVolumeCapacity}
                    formatter={(value) => `${value} GB`}
                    // @ts-ignore
                    parser={(value) => value.replace(/[^0-9.]/g, '')}
                    precision={0}
                    min={1}
                    step={1}
                    onChange={onChange}
                  />
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Timezone</CustomLabel>
              <Controller
                control={control}
                name="timezone"
                render={({ field: { value, onChange } }) => (
                  <TimeZone
                    value={value}
                    onChange={(nextTimezone) => {
                      onChange({
                        name: nextTimezone,
                        offset: timezones.find(
                          ({ name }) => name === nextTimezone
                        ).offset,
                      });
                    }}
                  />
                )}
              />
            </div>
          </Card>

          <Card title="Email Settings">
            <div style={{ width: '300px' }}>
              <CustomLabel>SMTP Host</CustomLabel>
              <Controller
                control={control}
                name="smtpHost"
                rules={{
                  required: true,
                }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChange={onChange}
                    data-testid="smtp-host"
                  />
                )}
              />
              {formState.errors.smtpHost && (
                <CustomLabel style={{ marginTop: '8px', padding: 0 }}>
                  <Typography.Text type="danger">
                    SMTP Host is required!
                  </Typography.Text>
                </CustomLabel>
              )}
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>SMTP Port</CustomLabel>
              <Controller
                control={control}
                name="smtpPort"
                render={({ field: { onChange } }) => (
                  <InputNumber
                    data-testid="smtp-port"
                    defaultValue={smtp.port}
                    precision={0}
                    min={1}
                    step={1}
                    onChange={onChange}
                  />
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>From Display Name</CustomLabel>
              <Controller
                control={control}
                name="smtpFromDisplayName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    data-testid="smtp-from-display-name"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>From</CustomLabel>
              <Controller
                control={control}
                name="smtpFrom"
                rules={{
                  pattern: EMAIL_REGEX,
                }}
                render={({ field: { onChange, value } }) => (
                  <CustomLabel>
                    <Input
                      data-testid="smtp-from"
                      value={value}
                      onChange={onChange}
                    />
                    {formState.errors.smtpFrom && (
                      <CustomLabel style={{ marginTop: '8px', padding: 0 }}>
                        <Typography.Text
                          type="danger"
                          data-testid="invalid-smtp-from"
                        >
                          Invalid Email
                        </Typography.Text>
                      </CustomLabel>
                    )}
                  </CustomLabel>
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Reply To Display Name</CustomLabel>
              <Controller
                control={control}
                name="smtpReplyDisplayName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    data-testid="smtp-reply-display-name"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Reply</CustomLabel>
              <Controller
                control={control}
                name="smtpReply"
                rules={{
                  pattern: EMAIL_REGEX,
                }}
                render={({ field: { onChange, value } }) => (
                  <CustomLabel>
                    <Input
                      data-testid="smtp-reply"
                      value={value}
                      onChange={onChange}
                    />
                    {formState.errors.smtpReply && (
                      <CustomLabel style={{ marginTop: '8px', padding: 0 }}>
                        <Typography.Text
                          type="danger"
                          data-testid="invalid-smtp-reply"
                        >
                          Invalid Email
                        </Typography.Text>
                      </CustomLabel>
                    )}
                  </CustomLabel>
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Envelope From</CustomLabel>
              <Controller
                control={control}
                name="smtpEnvelopeFrom"
                render={({ field: { onChange, value } }) => (
                  <Input
                    data-testid="smtp-envelop-from"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Enable SSL</CustomLabel>

              <Controller
                control={control}
                name="smtpEnableSSL"
                render={({ field: { onChange } }) => (
                  <Switch
                    data-testid="smtp-enable-ssl"
                    defaultChecked={smtp.enableSSL}
                    onChange={onChange}
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                  />
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Enable StartTLS</CustomLabel>

              <Controller
                control={control}
                name="smtpEnableStartTLS"
                render={({ field: { onChange } }) => (
                  <Switch
                    data-testid="smtp-enable-startTLS"
                    defaultChecked={smtp.enableStartTLS}
                    onChange={onChange}
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                  />
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Enable Authentication</CustomLabel>

              <Controller
                control={control}
                name="smtpEnableAuth"
                render={({ field: { onChange } }) => (
                  <Switch
                    data-testid="smtp-enable-auth"
                    defaultChecked={smtp.enableAuth}
                    onChange={onChange}
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                  />
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Username</CustomLabel>

              <Controller
                control={control}
                name="smtpUsername"
                rules={{
                  required: true,
                }}
                render={({ field: { onChange, value } }) => (
                  <>
                    <Input
                      data-testid="smtp-username"
                      value={value}
                      onChange={onChange}
                    />
                    {formState.errors.smtpUsername && (
                      <CustomLabel style={{ marginTop: '8px', padding: 0 }}>
                        <Typography.Text type="danger">
                          Username is required!
                        </Typography.Text>
                      </CustomLabel>
                    )}
                  </>
                )}
              />
            </div>

            <div style={{ width: '300px', marginTop: '32px' }}>
              <CustomLabel>Password</CustomLabel>

              <Controller
                control={control}
                name="smtpPassword"
                rules={{
                  required: true,
                }}
                render={({ field: { onChange, value } }) => (
                  <Input type="password" value={value} onChange={onChange} />
                )}
              />
              {formState.errors.smtpPassword && (
                <CustomLabel style={{ marginTop: '8px', padding: 0 }}>
                  <Typography.Text type="danger">
                    Password is required!
                  </Typography.Text>
                </CustomLabel>
              )}
            </div>
          </Card>
        </form>

        <div
          style={{
            display: 'flex',
            marginTop: '32px',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={() => {
              reset();
            }}
            style={{ marginRight: '16px' }}
          >
            Reset
          </Button>
          {/* @ts-ignore */}
          <Button type="primary" htmlType="submit" form="system-settings">
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
)(_SystemSetting);
