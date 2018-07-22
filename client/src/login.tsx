import * as axios from 'axios';
import * as React from 'react';
import { RouteComponentProps, Redirect } from 'react-router';
import { FormComponentProps } from 'antd/lib/form';
import {Row, Col, Form, Input, Icon, Button, notification} from 'antd';
import {LoginContainer, LogoContainer, FooterContainer, BodyWrapper} from 'components/login'

import logoWhite from 'images/logo-word.png';

const FormItem = Form.Item;

export interface Props extends RouteComponentProps<void>, FormComponentProps {
}

export class CMSApp extends React.Component<Props> {
  state = {
    redirectToReferrer: false
  };

  handleSubmit = (e: any) => {
    e.preventDefault();
    const {form} = this.props;
    form.validateFields((err: any, values: any) => {
      if (!err) {
        axios.default.post('/login', {
          appId: window['cannerApp'].id,
          username: values.username,
          password: values.password
        })
        .then((result) => {
          localStorage.setItem("apiToken", result.data.apiToken);
          localStorage.setItem("cannerUser", JSON.stringify({
            username: result.data.username,
            userId: result.data.userId,
            thumb: result.data.thumb
          }));
          this.setState({redirectToReferrer: true})
        })
        .catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;

          notification.error({
            message: 'Login Error',
            description: 'Please make sure your username and password is correct'
          })
          form.resetFields();
        });
      }
    });
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const { cmsPage } = window['cannerApp'];
    const { redirectToReferrer } = this.state;

    if (redirectToReferrer) {
      return <Redirect to={"/"} />;
    }

    return (
      <BodyWrapper topLeft={cmsPage.bgColorTopLeft} bottomRight={cmsPage.bgColorBottomRight}>
        <Row type="flex" justify="space-around" align="middle" style={{height: '100%'}}>
          <Col span={12}>
            <LogoContainer>
              <img src={cmsPage.loginLogo || logoWhite} style={{maxWidth: '480px'}}/>
            </LogoContainer>
            <LoginContainer>
              <Form onSubmit={this.handleSubmit}>
                <FormItem>
                  {getFieldDecorator('username', {
                    rules: [{ required: true, message: 'Please input your username!' }],
                  })(
                    <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" />
                  )}
                </FormItem>
                <FormItem>
                  {getFieldDecorator('password', {
                    rules: [{ required: true, message: 'Please input your password!' }],
                  })(
                    <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
                  )}
                </FormItem>
                <FormItem>
                  <Button type="primary" htmlType="submit" style={{width: "100%"}}>
                    Log in
                  </Button>
                </FormItem>
              </Form>
            </LoginContainer>
            <FooterContainer color={cmsPage.footerColor}>
              Powered by <a href="https://www.canner.io/" target="_blank">CannerIO</a>. &copy; Canner, Inc.
            </FooterContainer>
          </Col>
        </Row>
      </BodyWrapper>
    );
  }
}

export default Form.create()(CMSApp);
