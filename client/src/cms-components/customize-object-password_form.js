import React from 'react';
import {Switch, Input, Button, Form, Alert} from 'antd';
import {Item} from 'canner-helpers';
import gql from "graphql-tag";
import { Mutation } from "react-apollo";
import styled from 'styled-components';
const FormItem = Form.Item;

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
    confirmDirty: false
  };

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
    const {form: {getFieldDecorator}, rootValue, refId} = this.props;
    const id = getIdFromRootValue({
      rootValue,
      refId
    });
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    };
    return (
      <Mutation mutation={SETUP_PASSWORD}>
        {(resetPassword, {loading, error}) => (
          <Form
            onSubmit={e => {
              e.preventDefault();
              this.props.form.validateFields((err, values) => {
                if (!err) {
                  resetPassword({variables: {
                    temporary: values.temporary,
                    password: values.password,
                    id
                  }})
                }
              })
            }}
          >
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
                <Input type="password" />
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
                <Input type="password" onBlur={this.handleConfirmBlur} />
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
                <Switch />
              )}
            </FormItem>
            <FormItem
              wrapperCol={{span: 14, offset: 6}}
            >
              <Button htmlType="submit" loading={loading}>
                Reset Password
              </Button>
            </FormItem>
          </Form>
        )}
      </Mutation>
    )
  }
}

function getIdFromRootValue({
  rootValue,
  refId
}) {
  return rootValue.getIn(refId.getPathArr().slice(0, 2).concat('id'));
}