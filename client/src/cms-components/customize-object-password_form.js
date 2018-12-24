import React from 'react';
import {Switch, Input, Button, Form, Alert, notification} from 'antd';
import {get} from 'lodash';
import {Item} from 'canner-helpers';
import gql from "graphql-tag";
import { Mutation } from "react-apollo";
import styled from 'styled-components';
const FormItem = Form.Item;
import Spin from './spin';

const SETUP_PASSWORD = gql`
  mutation ResetPassword($id: String, $password: String, $temporary: Boolean) {
    resetPassword(id: $id, password: $password, temporary: $temporary) {
      id
    }
  }
`

const Title = styled.span`
  font-size: 18px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.65);
`;

@Form.create()
export default class EmailForm extends React.Component {
  state = {
    confirmDirty: false,
    loading: false
  };

  onCompleted = () => {
    setTimeout(() => {
      notification.success({
        message: 'Reset password successfully!',
        placement: 'bottomRight'
      });
      this.setState({
        loading: false
      });
    }, 700);
  }

  onError = (e) => {
    console.log(e);
    setTimeout(() => {
      notification.error({
        message: 'Reset password failed!',
        placement: 'bottomRight'
      });
      this.setState({
        loading: false
      });
    }, 700);
  }

  onClick = (resetPassword) => {
    const {rootValue, refId} = this.props;
    const id = getIdFromRootValue({
      rootValue,
      refId
    });
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({
          loading: true
        });
        resetPassword({variables: {
          temporary: values.temporary,
          password: values.password,
          id
        }})
      }
    })
  }

  compareToFirstPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && value !== form.getFieldValue('password')) {
      callback('Two passwords that you enter is inconsistent!');
    } else {
      callback();
    }
  }

  validateToNextPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    callback();
  }

  handleConfirmBlur = (e) => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  }

  render() {
    const {form: {getFieldDecorator}} = this.props;
    const {loading} = this.state;
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    };
    return (
      <Mutation mutation={SETUP_PASSWORD} onCompleted={this.onCompleted} onError={this.onError}>
        {(resetPassword, {error}) => (
          <Spin tip="Reseting password..." spinning={loading} delay={600}>
            <Form>
              {error && <Alert 
                message="Can't reset password, please check your password is correct."
                type="error"
                style={{marginBottom: 16}}
              />}
              <FormItem
                {...formItemLayout}
                label={<Title>Password</Title>}
              >
                {getFieldDecorator('password', {
                  rules: [{
                    required: true, message: 'Please input your password!',
                  }, {
                    validator: this.validateToNextPassword,
                  }],
                })(
                  <Input type="password" data-testid="reset-password-password-input"/>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label={<Title>Confirm Password</Title>}
              >
                {getFieldDecorator('confirm', {
                  rules: [{
                    required: true, message: 'Please confirm your password!',
                  }, {
                    validator: this.compareToFirstPassword,
                  }],
                })(
                  <Input data-testid="reset-password-confirm-input" type="password" onBlur={this.handleConfirmBlur} />
                )}
              </FormItem>
              <FormItem
                label={<Title>Temporary</Title>}
                {...formItemLayout}
              >
                {getFieldDecorator('temporary', {
                  rules: [],
                  initialValue: false
                })(
                  <Switch data-testid="reset-password-temporary-switch" />
                )}
              </FormItem>
              <FormItem
                wrapperCol={{span: 14, offset: 6}}
              >
                <Button data-testid="reset-password-reset-button" htmlType="button" onClick={() => this.onClick(resetPassword)}>
                  Reset Password
                </Button>
              </FormItem>
            </Form>
          </Spin>
        )}
      </Mutation>
    )
  }
}

function getIdFromRootValue({
  rootValue,
  refId
}) {
  return get(rootValue, refId.getPathArr().slice(0, 2).concat('id'));
}