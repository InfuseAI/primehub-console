import * as React from 'react';
import ReactDOM from 'react-dom';
import NotebookViewer from 'containers/sharedFiles/NotebookView';
import { BrowserRouter, Route } from 'react-router-dom';
import { appPrefix } from 'utils/env';
import { Logo } from 'containers/sharedFiles/NotebookShareOptions';
import { Button, Form, Input } from 'antd';

const UserRegistration = props => {
  const Header = () => {
    return (
      <div className='header_container' style={{ backgroundColor: '#373d62' }}>
        <Logo />
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(e);

  };

  const _ApplyForm = ({ form: { getFieldDecorator, getFieldsError } }) => {
    const hasErrors = fieldsError => {
      return Object.keys(fieldsError).some(field => fieldsError[field]);
    };

    return (
      <Form layout='inline' onSubmit={handleSubmit}>
        <Form.Item label={'Username'}>
          {getFieldDecorator('username', {
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
            disabled={hasErrors(getFieldsError())}
          >
            Create
          </Button>
        </Form.Item>
      </Form>
    );
  };

  const ApplyForm = Form.create()(_ApplyForm);
  const loginUrl = `${window.cmsHost}${window.APP_PREFIX}`;

  return (
    <>
      <Header />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <p>Create new account</p>
        <ApplyForm />
        <p>TODO: create a new account and show the password here</p>
        <p>You account is created. The password is *****</p>
        <p>Please use {loginUrl} to login and reset password</p>
      </div>
    </>
  );
};

const AnonymousPage = () => {
  return (
    <BrowserRouter>
      <Route path={`${appPrefix}share/`}>
        <NotebookViewer />
      </Route>
      <Route path={`${appPrefix}invite/`}>
        <UserRegistration />
      </Route>
    </BrowserRouter>
  );
};

ReactDOM.render(<AnonymousPage />, document.getElementById('root'));
