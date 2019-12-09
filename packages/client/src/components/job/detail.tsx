import * as React from 'react';
import {Button, Tabs, Form, Card} from 'antd';
import styled from 'styled-components';
import moment, { Moment } from 'moment';
import Log from './log';
import {getActionByPhase, Phase} from 'components/job/phase';

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
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 },
  },
};

type Props = {
  job: any;
}

export default class Detail extends React.Component<Props> {
  handleClick = () => {
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
            <Form>
              <Form.Item label="Phase:" {...formItemLayout}>
                {job.phase}
              </Form.Item>
              <Form.Item label="Job ID:" {...formItemLayout}>
                {job.id}
              </Form.Item>
              <Form.Item label="Job name" {...formItemLayout}>
                {job.displayName}
              </Form.Item>
              <Form.Item label="User:" {...formItemLayout}>
                {job.userName}
              </Form.Item>
              <Form.Item label="Start Time:" {...formItemLayout}>
                {startMoment.format('DD/MM/YYYY HH:mm:ss')}
              </Form.Item>
              <Form.Item label="Finish Time:" {...formItemLayout}>
                {finishMoment.format('DD/MM/YYYY HH:mm:ss')}
              </Form.Item>
              <Form.Item label="Duration" {...formItemLayout}>
                {computeDuration(startMoment, finishMoment)}
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane key="logs" tab="Logs" disabled={job.phase === Phase.Pending || !job.logEndpoint}>
            <Log value={job.logEndpoint}/>
          </TabPane>
        </Tabs>
      </Card>
    )
  }
}

function computeDuration(start: Moment, finish: Moment) {
  const duration = moment.duration(finish.diff(start));
  const hour = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();
  return `${hour}:${minutes}:${seconds}`;
}