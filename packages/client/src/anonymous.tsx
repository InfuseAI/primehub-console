import * as React from 'react';
import ReactDOM from 'react-dom';
import { useParams } from 'react-router-dom';
import NotebookViewer from 'containers/sharedFiles/NotebookView';
import { BrowserRouter, Route } from 'react-router-dom';
import { appPrefix } from 'utils/env';
import { Logo } from 'containers/sharedFiles/NotebookShareOptions';
import {
  Typography,
  Layout,
  Button,
  Form,
  Input,
  Card,
  notification,
} from 'antd';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import type { FormComponentProps } from 'antd/lib/form';
import { useClipboard } from 'hooks/useClipboard';

interface CreateUserVariables {
  username: string;
  invitationToken: string;
}

interface ApplyFormProps extends FormComponentProps {
  onCreate: (variables: CreateUserVariables) => Promise<void>;
}

const _ApplyForm: React.FC<ApplyFormProps> = ({ form, onCreate }) => {
  const { token } = useParams<{ token: string }>();
  const hasErrors = fieldsError =>
    Object.keys(fieldsError).some(field => fieldsError[field]);

  return (
    <Form
      layout='inline'
      onSubmit={event => {
        event.preventDefault();
        form.validateFields((err, values) => {
          if (err) return;

          onCreate({ invitationToken: token, username: values.username });

          form.setFieldsValue({ username: '' });
        });
      }}
    >
      <Form.Item label='Username'>
        {form.getFieldDecorator('username', {
          rules: [
            {
              required: true,
              pattern: /^[a-z0-9][-a-z0-9_.@]*$/,
              message: `Only lower case alphanumeric characters, '-', '.', and underscores ("_") are allowed, and must start with a letter or numeric.`,
            },
          ],
          initialValue: '',
        })(<Input data-testid='username' />)}
      </Form.Item>
      <Form.Item>
        <Button
          type='primary'
          htmlType='submit'
          disabled={hasErrors(form.getFieldsError())}
        >
          Create
        </Button>
      </Form.Item>
    </Form>
  );
};
const ApplyForm = Form.create<ApplyFormProps>()(_ApplyForm);

interface CreateUserResponse {
  code: 'SUCCESS' | 'BAD_REQUEST';
  message: string;
  createdUser?: {
    username: string;
    password: string;
  };
}

function UserRegistration() {
  const [createdUser, setCreatedUser] =
    React.useState<{ username: string; password: string }>();
  const { appPrefix } = useRoutePrefix();
  const CMS_URL = `${window.cmsHost}${appPrefix}`;

  async function createAccount({
    invitationToken,
    username,
  }: CreateUserVariables) {
    const INVITE_API = `${CMS_URL}invite`;

    try {
      const response: CreateUserResponse = await fetch(INVITE_API, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationToken, username }),
      }).then(res => res.json());

      if (response.code === 'SUCCESS') {
        notification.success({
          duration: 5,
          placement: 'bottomRight',
          message: 'Successfully created!',
        });
        setCreatedUser({
          username: response.createdUser.username,
          password: response.createdUser.password,
        });
      } else {
        notification.error({
          duration: 5,
          placement: 'bottomRight',
          message: response.message,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ backgroundColor: '#373d62' }}>
        <Logo />
      </Layout.Header>

      <Layout.Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '32px',
        }}
      >
        <Typography.Title>Create Account</Typography.Title>

        <ApplyForm onCreate={createAccount} />

        {createdUser && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: '32px',
            }}
          >
            <Typography.Paragraph>
              Your account is created, you can copy username and password to go{' '}
              <a href={CMS_URL} target='_blank' rel='noreferrer'>
                {CMS_URL}
              </a>{' '}
              to login and reset password.
            </Typography.Paragraph>

            <Typography.Paragraph>
              Username:{' '}
              <Typography.Text code copyable>
                {createdUser.username}
              </Typography.Text>
            </Typography.Paragraph>
            <Typography.Paragraph>
              Password:{' '}
              <Typography.Text code copyable>
                {createdUser.password}
              </Typography.Text>
            </Typography.Paragraph>
          </div>
        )}
      </Layout.Content>
    </div>
  );
}

function AuthorizationCode() {
  const code = window.apiTokenExhangeCode;
  const [copyStatus, copy] = useClipboard({ lazy: true, timeout: 2000 });
  return (
    <div>
      <div className='header_container' style={{ backgroundColor: '#373d62' }}>
        <Logo />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            border: '1px solid #ebedf0',
            padding: '42px 24px 50px',
          }}
        >
          <p>
            Please copy the code, switch to your application and paste it there:
          </p>
          <Input
            disabled
            style={{ marginBottom: '16px' }}
            value={code}
            addonAfter={
              <a
                onClick={() => {
                  if (!code) {
                    return;
                  }
                  copy(code);
                }}
                style={{ color: 'black' }}
              >
                {copyStatus === 'inactive' ? 'Copy' : 'Copied'}
              </a>
            }
          />
        </div>
      </div>
    </div>
  );
}

const AnonymousPage = () => {
  return (
    <BrowserRouter>
      <Route path={`${appPrefix}share/`}>
        <NotebookViewer />
      </Route>
      <Route path={`${appPrefix}invite/:token`}>
        <UserRegistration />
      </Route>
      <Route path={`${appPrefix}api-token/callback`}>
        <AuthorizationCode />
      </Route>
    </BrowserRouter>
  );
};

ReactDOM.render(<AnonymousPage />, document.getElementById('root'));
