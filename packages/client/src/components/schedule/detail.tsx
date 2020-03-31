import * as React from 'react';
import {Button, Form, Card, Input} from 'antd';
import {get} from 'lodash';
import styled from 'styled-components';
import Title from 'components/job/title';
import ScheduleBreadCrumb from 'components/schedule/breadcrumb';
import {History} from 'history';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';


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
    const {schedule = {}, runPhScheduleResult} = this.props;
    return (
      <>
        <PageTitle
          breadcrumb={<ScheduleBreadCrumb scheduleName={schedule.displayName} />}
          title={`Schedule: ${schedule.displayName || schedule.name}`}
        />
        <PageBody>
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button
              onClick={() => this.runSchedule()}
              loading={runPhScheduleResult.loading}
            >
              Run
            </Button>
          </div>
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
              {schedule.userName || '-'}
            </Form.Item>
            <Form.Item  style={formItemStyle} label="Group:" {...formItemLayout}>
              {schedule.groupName || '-'}
            </Form.Item>
            <Form.Item  style={formItemStyle} label="Instance type:" {...formItemLayout}>
              {get(schedule, 'instanceType.displayName', '') || get(schedule, 'instanceType.name', '')}
              <span style={{
                display: "block",
                marginTop: -12
              }}>
                (CPU: {get(schedule, 'instanceType.cpuLimit', '-')} / Memory: {get(schedule, 'instanceType.memoryLimit', '-')}G / GPU: {get(schedule, 'instanceType.gpuLimit', '-')})
              </span>
            </Form.Item>
            <Form.Item  style={blockStyle} label="Image:" {...formItemLayout}>
              {schedule.image || '-'}
            </Form.Item>
            <Form.Item  style={formItemStyle} label="Command:"  {...formItemLayout}>
              <Input.TextArea
                style={{
                  background: 'black',
                  color: '#ddd'
                }}
                rows={5}
                value={schedule.command}
              />
            </Form.Item>
          </Form>
        </PageBody>
      </>
    )
  }
}
