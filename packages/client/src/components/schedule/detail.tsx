import * as React from 'react';
import {Button, Form, Card, Input} from 'antd';
import {get} from 'lodash';
import styled from 'styled-components';
import Title from 'components/job/title';
import {History} from 'history';


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
  schedule: any;
  runPhSchedule: Function;
  runPhScheduleResult: any;
  history: History;
  appPrefix: string;
}

const blockStyle = {
  marginBottom: 36
}

const formItemStyle = {
  marginBottom: 0
}

export default class Detail extends React.Component<Props> {
  runSchedule = () => {
    const {schedule, runPhSchedule} = this.props;
    const {id} = schedule;
    return runPhSchedule({variables: {where: {id}}});
  }

  render() {
    const {schedule = {}, runPhScheduleResult, history} = this.props;
    const spec = get(schedule, 'jobTemplate.spec', {});
    return (
      <>
        <TitleContainer>
          <div>
            <Button
              icon="left"
              onClick={() => history.goBack()}
              style={{marginRight: 16, verticalAlign: 'top'}}
            >
              Back
            </Button>
            <Title>
              Schedule: {schedule.displayName || schedule.name}
            </Title>
          </div>
          <Button
            onClick={() => this.runSchedule()}
            loading={runPhScheduleResult.loading}
          >
            Run
          </Button>
        </TitleContainer>
        <Card>
          <Form>
            <Form.Item style={formItemStyle} label="Status:" {...formItemLayout}>
              {schedule.phase}
            </Form.Item>
            <Form.Item  style={formItemStyle} label="Schedule ID:" {...formItemLayout}>
              {schedule.id}
            </Form.Item>
            <Form.Item  style={formItemStyle} label="Schedule name" {...formItemLayout}>
              {schedule.displayName || '-'}
            </Form.Item>
            <Form.Item  style={formItemStyle} label="User:" {...formItemLayout}>
              {spec.userName || '-'}
            </Form.Item>
            <Form.Item  style={formItemStyle} label="Group:" {...formItemLayout}>
              {spec.groupName || '-'}
            </Form.Item>
            <Form.Item  style={formItemStyle} label="Instance type:" {...formItemLayout}>
              {get(spec, 'instanceType.displayName', '') || get(spec, 'instanceType.name', '')}
              <span style={{
                display: "block",
                marginTop: -12
              }}>
                (CPU: {get(spec, 'instanceType.cpuLimit', '-')} / Memory: {get(spec, 'instanceType.memoryLimit', '-')}G / GPU: {get(schedule, 'instanceType.gpuLimit', '-')})
              </span>
            </Form.Item>
            <Form.Item  style={blockStyle} label="Image:" {...formItemLayout}>
              {spec.image || '-'}
            </Form.Item>
            <Form.Item  style={formItemStyle} label="Command:"  {...formItemLayout}>
              <Input.TextArea
                style={{
                  background: 'black',
                  color: '#ddd'
                }}
                rows={5}
                value={spec.command}
              />
            </Form.Item>
          </Form>
        </Card>
      </>
    )
  }
}
