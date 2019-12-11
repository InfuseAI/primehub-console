import * as React from 'react';
import {Button, Tabs, Form, Card, Input} from 'antd';
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

const blockStyle = {
  marginBottom: 36
}

const formItemStyle = {
  marginBottom: 0
}

export default class Detail extends React.Component<Props> {
  handleClick = () => {
  }

  render() {
    const {job} = this.props;
    const startTime = job.startTime ? moment(job.startTime) : '';
    const finishTime = job.finishTime ? moment(job.finishTime) : '';
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
              <Form.Item style={blockStyle} label="Status:" {...formItemLayout}>
                {job.phase}
              </Form.Item>
              <Form.Item  style={formItemStyle} label="Job ID:" {...formItemLayout}>
                {job.id}
              </Form.Item>
              <Form.Item  style={formItemStyle} label="Job name" {...formItemLayout}>
                {job.displayName || '-'}
              </Form.Item>
              <Form.Item  style={formItemStyle} label="User:" {...formItemLayout}>
                {job.userName || '-'}
              </Form.Item>
              <Form.Item  style={formItemStyle} label="Start Time:" {...formItemLayout}>
                {startTime ? startTime.format('DD/MM/YYYY HH:mm:ss') : '-'}
              </Form.Item>
              <Form.Item  style={formItemStyle} label="Finish Time:" {...formItemLayout}>
                {finishTime ? finishTime.format('DD/MM/YYYY HH:mm:ss') : '-'}
              </Form.Item>
              <Form.Item  style={blockStyle} label="Duration" {...formItemLayout}>
                {computeDuration(startTime, finishTime)}
              </Form.Item>
              <Form.Item  style={formItemStyle} label="Group:" {...formItemLayout}>
                {job.groupName || '-'}
              </Form.Item>
              <Form.Item  style={formItemStyle} label="Instance type:" {...formItemLayout}>
                {job.instanceType || '-'}
              </Form.Item>
              <Form.Item  style={blockStyle} label="Image:" {...formItemLayout}>
                {job.image || '-'}
              </Form.Item>
              <Form.Item  style={formItemStyle} label="Command:"  {...formItemLayout}>
                <Input.TextArea
                  style={{
                    background: 'black',
                    color: '#ddd'
                  }}
                  rows={5}
                  value={job.command}
                />
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

export function computeDuration(start: Moment | '', finish: Moment | '') {
  if (!start || !finish) {
    return '-';
  }
  const duration = moment.duration(finish.diff(start));
  const hour = ensureFormat(duration.hours());
  const minutes = ensureFormat(duration.minutes());
  const seconds = ensureFormat(duration.seconds());
  return `${hour}:${minutes}:${seconds}`;
}

function ensureFormat(str) {
  str = String(str);
  return str.length === 1 ? `0${str}` : str;
}