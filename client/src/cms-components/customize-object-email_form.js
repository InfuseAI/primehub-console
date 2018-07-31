import React from 'react';
import {Select, Input, Button, Form} from 'antd';
import {Item} from 'canner-helpers';
import gql from "graphql-tag";
import { Mutation } from "react-apollo";
import styled from 'styled-components';
const FormItem = Form.Item;
const Option = Select.Option;

const SEND_EMAIL = gql`
  mutation SendEmail($id: string, $resetActions: string, $expiresIn: number) {
    sendEmail(id: $id, resetActions: $resetActions, expiresIn: $expiresIn) {
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
      <Mutation mutation={SEND_EMAIL}>
        {(sendEmail, {loading, error}) => (
          <Form
            onSubmit={e => {
              e.preventDefault();
              this.props.form.validateFields((err, values) => {
                if (!err) {
                  const expiresIn = parseToSecond(values.expiresIn);
                  sendEmail({variables: {
                    resetActions: values.resetActions,
                    expiresIn,
                    id
                  }})
                }
              })
            }}
          >
            <FormItem
              label={<Title>Reset Actions</Title>}
              {...formItemLayout}
            >
              {getFieldDecorator('resetActions', {
                rules: [{
                  required: true, message: 'Please select an action.'
                }]
              })(
                <Select>
                  <Option value="VERIFY_EMAIL">Verify Email</Option>
                  <Option value="UPDATE_PROFILE">Update Profile</Option>
                  <Option value="CONFIGURE_TOTP">Configure OTP</Option>
                  <Option value="UPDATE_PASSWORD">Update Password</Option>
                </Select>
              )}
            </FormItem>
            <FormItem
              label={<Title>Expires In</Title>}
              {...formItemLayout}
            >
              {getFieldDecorator('expiresIn', {
                rules: [],
                initialValue: {
                  number: 0,
                  unit: 'hours'
                }
              })(
                <Expires />
              )}
            </FormItem>
            <FormItem
              label={<Title>Reset Actions Email</Title>}
              {...formItemLayout}
            >
              <Button htmlType="submit" loading={loading}>
                Send Email
              </Button>
            </FormItem>
          </Form>
        )}
      </Mutation>
    )
  }
}

class Expires extends React.Component {
  constructor(props) {
    super(props);

    const value = props.value || {};
    this.state = {
      number: value.number || 0,
      unit: value.unit || 'hours',
    };
  }

  componentWillReceiveProps(nextProps) {
    // Should be a controlled component.
    if ('value' in nextProps) {
      const value = nextProps.value;
      this.setState(value);
    }
  }

  handleNumberChange = (e) => {
    const number = parseInt(e.target.value || 0, 10);
    if (isNaN(number)) {
      return;
    }
    if (!('value' in this.props)) {
      this.setState({ number });
    }
    this.triggerChange({ number });
  }

  handleUnitChange = (unit) => {
    if (!('value' in this.props)) {
      this.setState({ unit });
    }
    this.triggerChange({ unit });
  }

  triggerChange = (changedValue) => {
    // Should provide an event to pass value to Form.
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(Object.assign({}, this.state, changedValue));
    }
  }

  render() {
    const { size } = this.props;
    const state = this.state;
    return (
      <span>
        <Input
          type="text"
          size={size}
          value={state.number}
          onChange={this.handleNumberChange}
          style={{ width: '65%', marginRight: '3%' }}
          min="0"
        />
        <Select
          value={state.unit}
          size={size}
          style={{ width: '32%' }}
          onChange={this.handleUnitChange}
        >
          <Option value="hours">Hours</Option>
          <Option value="minutes">Minutes</Option>
        </Select>
      </span>
    );
  }
}

function parseToSecond(expiresIn) {
  const {number, unit} = expiresIn;

  switch (unit) {
    case 'hours': 
      return number * 60 * 60;
    case 'minutes':
      return number * 60;
  }
}

function getIdFromRootValue({
  rootValue,
  refId
}) {
  return rootValue.getIn(refId.getPathArr().slice(0, 2).concat('id'));
}