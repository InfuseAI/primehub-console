import * as React from 'react';
import { Select, Input, Typography, Tooltip, Icon } from 'antd';
import { Controller, UseFormReturn } from 'react-hook-form';

import type { Secret } from './types';

function TypeTooltip() {
  return (
    <Tooltip
      placement="bottom"
      title={
        <div>
          Specify the type of the secret.{' '}
          <a
            href="https://docs.primehub.io/docs/guide_manual/admin-secret#type-opaque"
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

export const initialFormState: Secret = {
  id: '',
  name: '',
  displayName: '',
  type: undefined,
  registryHost: '',
  username: '',
  password: '',
  secret: '',
};

interface SecretFormProps extends Omit<UseFormReturn<Secret>, 'reset'> {
  onSubmit?: (data: Partial<Secret>) => Promise<void>;
  disabledName?: boolean;
  footer?: React.ReactNode;
}

export function SecretForm(props: SecretFormProps) {
  const { control, watch, formState, handleSubmit } = props;
  const watchedSecretType = watch('type');

  return (
    <form
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: '#fff',
      }}
      onSubmit={props?.onSubmit && handleSubmit(props.onSubmit)}
    >
      <div>
        <label htmlFor="secret-name">Name</label>
        <Controller
          control={control}
          name="name"
          rules={{
            required: true,
          }}
          render={({ field: { value, onChange } }) => (
            <Input
              id="secret-name"
              disabled={props?.disabledName || false}
              value={value}
              onChange={onChange}
              style={{ marginTop: '8px' }}
            />
          )}
        />
        {!props?.disabledName && formState.errors.name && (
          <Typography.Text type="danger">Name is required</Typography.Text>
        )}
      </div>

      <div>
        <label htmlFor="secret-display-name">Display Name</label>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, value } }) => (
            <Input
              id="secret-display-name"
              value={value}
              onChange={onChange}
              style={{ marginTop: '8px' }}
            />
          )}
        />
      </div>

      <div>
        <label htmlFor="secret-type">
          Type <TypeTooltip />
        </label>
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => {
            return (
              <Select
                data-testid="secret-type"
                value={value}
                onChange={onChange}
                style={{ marginTop: '8px' }}
              >
                <Select.Option value="opaque">Git Dataset</Select.Option>
                <Select.Option value="kubernetes">Image Pull</Select.Option>
              </Select>
            );
          }}
        />
      </div>

      {watchedSecretType === undefined ? null : watchedSecretType ===
        'opaque' ? (
        <div>
          <label htmlFor="Secret">Secret</label>
          <Controller
            control={control}
            name="secret"
            render={({ field: { value, onChange } }) => (
              <Input.TextArea
                rows={4}
                value={value}
                onChange={onChange}
                style={{ marginTop: '8px' }}
              />
            )}
          />
        </div>
      ) : (
        <>
          <div>
            <span style={{ color: '#ff7875' }}>*</span>{' '}
            <label htmlFor="RegistryHost">Registry Host</label>
            <Controller
              control={control}
              name="registryHost"
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  value={value}
                  onChange={onChange}
                  style={{ marginTop: '8px' }}
                />
              )}
            />
            {formState.errors.registryHost && (
              <Typography.Text type="danger">
                Registry Host is required
              </Typography.Text>
            )}
          </div>
          <div>
            <span style={{ color: '#ff7875' }}>*</span>{' '}
            <label htmlFor="Username">Username</label>
            <Controller
              control={control}
              name="username"
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  value={value}
                  onChange={onChange}
                  style={{ marginTop: '8px' }}
                />
              )}
            />
            {formState.errors.username && (
              <Typography.Text type="danger">
                Username is required
              </Typography.Text>
            )}
          </div>
          <div>
            <span style={{ color: '#ff7875' }}>*</span>{' '}
            <label htmlFor="Password">Password</label>
            <Controller
              control={control}
              name="password"
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  type="password"
                  value={value}
                  onChange={onChange}
                  style={{ marginTop: '8px' }}
                />
              )}
            />
            {formState.errors.password && (
              <Typography.Text type="danger">
                Password is required
              </Typography.Text>
            )}
          </div>
        </>
      )}

      {props?.footer}
    </form>
  );
}
