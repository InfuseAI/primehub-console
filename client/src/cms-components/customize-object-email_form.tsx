import React from 'react';
import {Select, Input, Button, Form, notification} from 'antd';
import {Item} from 'canner-helpers';
import {get} from 'lodash';
import gql from "graphql-tag";
import { Mutation } from "react-apollo";
import styled from 'styled-components';
import Spin from './spin';
import Expires from './customize-number-expires';
import ResetActions from './customize-array-reset_actions';

const FormItem = Form.Item;
const Option = Select.Option;

const SEND_EMAIL = gql`
  mutation SendEmail($id: String, $resetActions: [String], $expiresIn: Int) {
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

interface Props {
  form: any;
  rootValue: any;
  refId: any;
}

class EmailForm extends React.Component<Props> {
  state = {
    loading: false
  };

  onCompleted = () => {
    setTimeout(() => {
      notification.success({
        message: 'Send email successfully!',
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
        message: 'Send email failed!',
        placement: 'bottomRight'
      });
      this.setState({
        loading: false
      });
    }, 700);
  }

  onClick = (sendEmail) => {
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
        const expiresIn = parseToSecond(values.expiresIn);
        sendEmail({variables: {
          resetActions: values.resetActions,
          expiresIn,
          id
        }})
      }
    });
  }

  render() {
    const {form: {getFieldDecorator}} = this.props;
    const {loading} = this.state;

    const formItemLayout = {
      labelCol: { xs: 24, sm: 6 },
      wrapperCol: { xs: 24, sm: 14 },
    };
    return (
      <Mutation mutation={SEND_EMAIL} onCompleted={this.onCompleted} onError={this.onError}>
        {(sendEmail) => (
          <Spin tip="Sending..." spinning={loading} delay={600}>
            <Form>
              <FormItem
                label={<Title>Reset Actions</Title>}
                {...formItemLayout}
              >
                {getFieldDecorator('resetActions', {
                  rules: [{
                    required: true, message: 'Please select an action.'
                  }]
                })(
                  <ResetActions isReactComponent />
                )}
              </FormItem>
              <FormItem
                label={<Title>Expires In</Title>}
                {...formItemLayout}
              >
                {getFieldDecorator('expiresIn', {
                  rules: [],
                  initialValue: {
                    number: 24,
                    unit: 'hours'
                  }
                })(
                  <Expires isReactComponent />
                )}
              </FormItem>
              <FormItem
                label={<Title>Reset Actions Email</Title>}
                {...formItemLayout}
              >
                <Button data-testid="email-button" htmlType="button" onClick={() => this.onClick(sendEmail)}>
                  Send Email
                </Button>
              </FormItem>
            </Form>
          </Spin>
        )}
      </Mutation>
    )
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
  return get(rootValue, refId.getPathArr().slice(0, 2).concat('id'));
}

export default Form.create()(EmailForm);
