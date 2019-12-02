import * as React from 'react';
import {Button, Tabs, Form} from 'antd';
import styled from 'styled-components';
import {STATUS} from './list';
import moment from 'moment';

const TabPane = Tabs.TabPane;

const Title = styled.h2`
`;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 12 },
  },
};

export default class Detail extends React.Component {
  render() {
    const {match} = this.props;

    const job = {
      id: 'y23456',
      status: STATUS.SUCCEED,
      name: 'train_123 model by using yyy_pretrained_model',
      user: {
        username: 'Alice'
      },
      group: {
        displayName: 'dev-group'
      },
      duration: '0:05:13',
      createTime: new Date().toString()
    }
    console.log(this.props)
    return (
      <React.Fragment>
        <TitleContainer>
          <Title>
            Job: {job.name}
          </Title>
          <Button>
            Cancel
          </Button>
        </TitleContainer>
        <Tabs>
          <TabPane key="information" tab="Information">
            <Form {...formItemLayout}>
              <Form.Item label="Status:">
                Running
              </Form.Item>
              <Form.Item label="Job ID:">
                {job.id}
              </Form.Item>
              <Form.Item label="Job name">
                {job.name}
              </Form.Item>
              <Form.Item label="User:">
                {job.user.username}
              </Form.Item>
              <Form.Item label="Create Time:">
                {moment(job.createTime).format('DD/MM/YYYY HH:mm:ss')}
              </Form.Item>
              <Form.Item label="Start Time:">
                {moment(job.createTime).format('DD/MM/YYYY HH:mm:ss')}
              </Form.Item>
              <Form.Item label="Duration">
                {job.duration}
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane key="logs" tab="Logs">
            <div style={{background: 'black', color: 'white'}} />
          </TabPane>
        </Tabs>
      </React.Fragment>
    )
  }
}