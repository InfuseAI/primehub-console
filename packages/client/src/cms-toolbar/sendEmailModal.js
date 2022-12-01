import React from 'react';
import { Select, Input, Button, Form, notification, Alert } from 'antd';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';
import Spin from '../cms-components/spin';

const FormItem = Form.Item;
const Option = Select.Option;

export const SEND_MULTI_EMAIL = gql`
  mutation SendMultiEmail(
    $in: [String]
    $resetActions: [String]
    $expiresIn: Int
  ) {
    sendMultiEmail(
      in: $in
      resetActions: $resetActions
      expiresIn: $expiresIn
    ) {
      status
    }
  }
`;

@Form.create()
export default class EmailForm extends React.Component {
  state = {
    loading: false,
  };

  onCompleted = () => {
    const { closeModal } = this.props;
    setTimeout(() => {
      notification.success({
        message: 'Send email successfully!',
        placement: 'bottomRight',
      });
      this.setState({
        loading: false,
      });
      closeModal();
    }, 700);
  };

  onError = e => {
    const { closeModal } = this.props;
    console.log(e);
    setTimeout(() => {
      notification.error({
        message: 'Send email failed!',
        placement: 'bottomRight',
      });
      this.setState({
        loading: false,
      });
      closeModal();
    }, 700);
  };

  onClick = sendEmail => {
    const { rootValue, refId, ids } = this.props;

    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({
          loading: true,
        });
        const expiresIn = parseToSecond(values.expiresIn);
        sendEmail({
          variables: {
            resetActions: values.resetActions,
            expiresIn,
            in: ids,
          },
        });
      }
    });
  };

  render() {
    const {
      form: { getFieldDecorator },
      ids = [],
    } = this.props;
    const { loading } = this.state;

    const formItemLayout = {
      labelCol: { xs: 24, sm: 8 },
      wrapperCol: { xs: 24, sm: 16 },
    };
    return (
      <Mutation
        mutation={SEND_MULTI_EMAIL}
        onCompleted={this.onCompleted}
        onError={this.onError}
      >
        {sendEmail => (
          <Spin tip='Sending...' spinning={loading} delay={600}>
            <Alert
              message={
                <div>
                  Selected <b>{ids.length}</b> users.
                </div>
              }
              type='info'
              style={{ marginBottom: 16 }}
            />
            {ids.length && (
              <Form>
                <FormItem label='Reset Actions' {...formItemLayout}>
                  {getFieldDecorator('resetActions', {
                    rules: [
                      {
                        required: true,
                        message: 'Please select an action.',
                      },
                    ],
                  })(
                    <Select mode='multiple' data-testid='reset-actions-select'>
                      <Option
                        data-testid={`reset-actions-option-verify-email`}
                        value='VERIFY_EMAIL'
                      >
                        Verify Email
                      </Option>
                      <Option
                        data-testid={`reset-actions-option-update-profile`}
                        value='UPDATE_PROFILE'
                      >
                        Update Profile
                      </Option>
                      <Option
                        data-testid={`reset-actions-option-configure-otp`}
                        value='CONFIGURE_TOTP'
                      >
                        Configure OTP
                      </Option>
                      <Option
                        data-testid={`reset-actions-option-update-password`}
                        value='UPDATE_PASSWORD'
                      >
                        Update Password
                      </Option>
                    </Select>
                  )}
                </FormItem>
                <FormItem label='Expires In' {...formItemLayout}>
                  {getFieldDecorator('expiresIn', {
                    rules: [],
                    initialValue: {
                      number: 24,
                      unit: 'hours',
                    },
                  })(<Expires />)}
                </FormItem>
                <FormItem label='Reset Actions Email' {...formItemLayout}>
                  <Button
                    data-testid='email-button'
                    htmlType='button'
                    onClick={() => this.onClick(sendEmail)}
                  >
                    Send Email
                  </Button>
                </FormItem>
              </Form>
            )}
          </Spin>
        )}
      </Mutation>
    );
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

  handleNumberChange = e => {
    const number = parseInt(e.target.value || 0, 10);
    if (isNaN(number)) {
      return;
    }
    if (!('value' in this.props)) {
      this.setState({ number });
    }
    this.triggerChange({ number });
  };

  handleUnitChange = unit => {
    if (!('value' in this.props)) {
      this.setState({ unit });
    }
    this.triggerChange({ unit });
  };

  triggerChange = changedValue => {
    // Should provide an event to pass value to Form.
    const onChange = this.props.onChange;
    if (onChange) {
      onChange(Object.assign({}, this.state, changedValue));
    }
  };

  render() {
    const { size } = this.props;
    const state = this.state;
    return (
      <span>
        <Input
          data-testid='expires-in-input'
          type='text'
          size={size}
          value={state.number}
          onChange={this.handleNumberChange}
          style={{ width: '65%', marginRight: '3%' }}
          min='0'
        />
        <Select
          data-testid='expires-in-select'
          value={state.unit}
          size={size}
          style={{ width: '32%' }}
          onChange={this.handleUnitChange}
        >
          <Option data-testid='expires-in-option-hours' value='hours'>
            Hours
          </Option>
          <Option data-testid='expires-in-option-minutes' value='minutes'>
            Minutes
          </Option>
        </Select>
      </span>
    );
  }
}

export function parseToSecond(expiresIn) {
  const { number, unit } = expiresIn;

  switch (unit) {
    case 'hours':
      return number * 60 * 60;
    case 'minutes':
      return number * 60;
  }
}
