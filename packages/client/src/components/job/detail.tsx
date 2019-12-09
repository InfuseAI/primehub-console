import * as React from 'react';
import {Button, Tabs, Form, Card} from 'antd';
import styled from 'styled-components';
import moment from 'moment';
import Log from './log';
import {getActionByPhase} from 'components/job/phase';

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

type Props = {
  job: any;
}

export default class Detail extends React.Component<Props> {
  handleClick = () => {
    const {
      id
    } = this.props.job;
  }

  render() {
    const {job} = this.props;
    const startMoment = moment(job.startTime);
    const finishMoment = moment(job.finishTime);
    return (
      <Card>
        <TitleContainer>
          <Title>
            Job: {job.name}
          </Title>
          <Button onClick={this.handleClick}>
            {getActionByPhase(job.phase)}
          </Button>
        </TitleContainer>
        <Tabs>
          <TabPane key="information" tab="Information">
            <Form {...formItemLayout}>
              <Form.Item label="Status:">
                {job.phase}
              </Form.Item>
              <Form.Item label="Job ID:">
                {job.id}
              </Form.Item>
              <Form.Item label="Job name">
                {job.displayName}
              </Form.Item>
              <Form.Item label="User:">
                {job.userName}
              </Form.Item>
              <Form.Item label="Start Time:">
                {startMoment.format('DD/MM/YYYY HH:mm:ss')}
              </Form.Item>
              <Form.Item label="Finish Time:">
                {finishMoment.format('DD/MM/YYYY HH:mm:ss')}
              </Form.Item>
              <Form.Item label="Duration">
                {moment.duration(finishMoment.diff(startMoment)).minutes()} minutes
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane key="logs" tab="Logs">
            <Log value={job.logEndpoint}/>
          </TabPane>
        </Tabs>
      </Card>
    )
  }
}