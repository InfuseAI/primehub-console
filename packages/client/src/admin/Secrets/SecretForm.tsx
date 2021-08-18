import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, Form, Select, Input, Tooltip, Icon } from 'antd';
import type { FormComponentProps } from 'antd/lib/form';

import { useRoutePrefix } from 'hooks/useRoutePrefix';

import type { SecretType, TSecret } from './types';

function SecretTypeTip() {
  return (
    <Tooltip
      placement='bottom'
      title={
        <div>
          Specify the type of the secret.{' '}
          <a
            href='https://docs.primehub.io/docs/guide_manual/admin-secret#type-opaque'
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
  );
}

type SecretFormState = Pick<
  TSecret,
  | 'id'
  | 'name'
  | 'displayName'
  | 'type'
  | 'registryHost'
  | 'username'
  | 'password'
  | 'secret'
>;

export const initialFormState: SecretFormState = {
  id: '',
  name: '',
  displayName: '',
  type: undefined,
  registryHost: '',
  username: '',
  password: '',
  secret: '',
};

type SecretFormProps = FormComponentProps<SecretFormState> & {
  onSubmit?: (data: Partial<SecretFormState>) => void;
  disabledName?: boolean;
  data?: SecretFormState;
};

export function _SecretForm({ form, data, ...props }: SecretFormProps) {
  const [secretType, setSecretType] = React.useState<SecretType>(null);
  const { appPrefix } = useRoutePrefix();

  React.useEffect(() => {
    if (data?.type) {
      setSecretType(data.type);
    } else {
      setSecretType('opaque');
    }
  }, [data]);

  return (
    <Form
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
      }}
      onSubmit={event => {
        event.preventDefault();

        form.validateFields((err, values: SecretFormState) => {
          if (err) {
            console.error(err);
            return;
          }

          if (props?.onSubmit) {
            props.onSubmit(values);
          }
        });
      }}
    >
      <Form.Item label='Name'>
        {form.getFieldDecorator('name', {
          initialValue: data?.name || '',
          validateTrigger: ['onChange', 'onBlur'],
          rules: [
            {
              required: !props?.disabledName || false,
              validator: (_, value, callback) => {
                if (
                  !value.match(
                    /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
                  )
                ) {
                  return callback(`lower case alphanumeric characters, '-' or '.', and must start and
                  end with an alphanumeric character.`);
                }
                return true;
              },
            },
          ],
        })(<Input disabled={props?.disabledName || false} />)}
      </Form.Item>

      <Form.Item label='Display Name'>
        {form.getFieldDecorator('displayName', {
          initialValue: data?.displayName || '',
        })(<Input />)}
      </Form.Item>

      <Form.Item>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          Type <SecretTypeTip />:
        </label>

        {form.getFieldDecorator('type', {
          initialValue: data?.type || 'opaque',
        })(
          <Select
            data-testid='secret-type'
            onChange={value => setSecretType(value as SecretType)}
          >
            <Select.Option value='opaque'>Git Dataset</Select.Option>
            <Select.Option value='kubernetes'>Image Pull</Select.Option>
          </Select>
        )}
      </Form.Item>

      {secretType === 'opaque' ? (
        <Form.Item label='Secret'>
          {form.getFieldDecorator('secret', {
            initialValue: data?.secret || '',
          })(<Input.TextArea rows={4} />)}
        </Form.Item>
      ) : (
        <>
          <Form.Item label='Registry Host'>
            {form.getFieldDecorator('registryHost', {
              initialValue: data?.registryHost || '',
              validateTrigger: ['onChange', 'onBlur'],
              rules: [
                {
                  required: true,
                },
              ],
            })(<Input />)}
          </Form.Item>

          <Form.Item label='Username'>
            {form.getFieldDecorator('username', {
              initialValue: data?.username || '',
              validateTrigger: ['onChange', 'onBlur'],
              rules: [
                {
                  required: true,
                },
              ],
            })(<Input />)}
          </Form.Item>

          <Form.Item label='Password'>
            {form.getFieldDecorator('password', {
              initialValue: data?.password || '',
              validateTrigger: ['onChange', 'onBlur'],
              rules: [
                {
                  required: true,
                },
              ],
            })(<Input type='password' />)}
          </Form.Item>
        </>
      )}

      <Form.Item>
        {form.getFieldDecorator('id', {
          initialValue: data?.id || '',
        })(<Input type='hidden' />)}
      </Form.Item>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'flex-end',
        }}
      >
        <Button>
          <Link to={`${appPrefix}admin/secret`}>Cancel</Link>
        </Button>

        {/* @ts-ignore */}
        <Button type='primary' htmlType='submit'>
          Save
        </Button>
      </div>
    </Form>
  );
}

export const SecretForm = Form.create({
  name: 'secret-form',
})(_SecretForm);
