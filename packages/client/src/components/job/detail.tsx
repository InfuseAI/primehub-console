import * as React from 'react';
import {Tabs, Form, Card, Input, Modal} from 'antd';
import {Link} from 'react-router-dom';
import {get} from 'lodash';
import styled from 'styled-components';
import moment, { Moment } from 'moment';
import Log from './log';
import {getActionByPhase, Phase} from 'components/job/phase';
import Title from 'components/job/title';
import Message from 'components/share/message';
import JobBreadcrumb from 'components/job/breadcrumb';
import {History} from 'history';
import {appPrefix} from 'utils/env';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';

const TabPane = Tabs.TabPane;

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

const {confirm} = Modal;

const maxMessageLength = 60;

const POD_FAILED = 'PodFailed';

const renderMessage = (job: Record<string, any>) => {
  if (job.cancel || job.phase === 'Cancelled')
    return 'Cancelled by user';
  switch (job.phase) {
    case 'Succeeded':
      return <Message text={job.message} /> || 'Job Complete';
    case 'Failed':
      if (job.reason === POD_FAILED)
        return <Message
          text={job.message}
          extra={<span>Please see <b>Logs</b> tab for more details</span>}
        />;
      if (!job.message) return <span><b>[System Error]</b> {job.reason}</span>;
      const lastLine = (job.message || '').replace(/\n$/, '').split('\n').pop();
      if (lastLine.length < maxMessageLength)
        return <span><b>[Runtime Error]</b> {lastLine}</span>;
      return <span><b>[Runtime Error]</b> {lastLine.substr(0, maxMessageLength)}... Find more info in <b>Logs</b> tab</span>
    default:
      return <Message text={job.message} /> || '-';
  }
};

const renderFinishTime = (job: Record<string, any>) => {
  if (job.phase === Phase.Running) return '-'
  return job.finishTime ?
    moment(job.finishTime).format('YYYY-MM-DD HH:mm:ss') :
    '-';
}

type Props = {
  job: any;
  rerunPhJob: Function;
  cancelPhJob: Function;
  cancelPhJobResult: any;
  rerunPhJobResult: any;
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
  handleClick = (action: 'Cancel' | 'Rerun') => {
    const {job, rerunPhJob, cancelPhJob} = this.props;
    const {id} = job;
    if (action === 'Cancel') 
      return confirm({
        title: `Cancel`,
        content: `Do you want to cancel '${job.displayName || job.name}'?`,
        iconType: 'info-circle',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk() {
          return cancelPhJob({variables: {where: {id}}});
        },
        onCancel() {
          console.log('Cancel');
        },
      });
    return confirm({
      title: `Rerun`,
      content: `Do you want to rerun '${job.displayName || job.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        return rerunPhJob({variables: {where: {id}}});
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }


  render() {
    const {job, rerunPhJobResult, cancelPhJobResult, history} = this.props;
    const createTime = job.createTime ? moment(job.createTime) : '';
    const startTime = job.startTime ? moment(job.startTime) : '';
    const finishTime = job.finishTime ? moment(job.finishTime) : '';
    const action = getActionByPhase(job.phase);
    return (
      <>
        <PageTitle
          breadcrumb={<JobBreadcrumb jobName={job.displayName || job.name} />}
          title={`Job: ${job.displayName || job.name}`}
        />
        <PageBody>
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <InfuseButton
              onClick={() => this.handleClick(action)}
              loading={rerunPhJobResult.loading || cancelPhJobResult.loading}
            >
              {action}
            </InfuseButton>
          </div>
          <Tabs>
            <TabPane key="information" tab="Information">
              <Form>
                <Form.Item style={formItemStyle} label="Status:" {...formItemLayout}>
                  {job.phase}
                </Form.Item>
                <Form.Item style={blockStyle} label="Message:" {...formItemLayout}>
                  {renderMessage(job)}
                </Form.Item>
                <Form.Item  style={formItemStyle} label="Job ID:" {...formItemLayout}>
                  {job.id}
                </Form.Item>
                <Form.Item  style={formItemStyle} label="Job name" {...formItemLayout}>
                  {job.displayName || '-'}
                </Form.Item>
                <Form.Item  style={formItemStyle} label="Schedule" {...formItemLayout}>
                  {
                    job.schedule ? (
                      <Link to={`${appPrefix}schedule/${job.schedule}`}>
                        {job.schedule}
                      </Link>
                    ) : '-'
                  }
                  
                </Form.Item>
                <Form.Item  style={formItemStyle} label="User:" {...formItemLayout}>
                  {job.userName || '-'}
                </Form.Item>
                <Form.Item  style={formItemStyle} label="Creation Time:" {...formItemLayout}>
                  {createTime ? createTime.format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Form.Item>
                <Form.Item  style={formItemStyle} label="Start Time:" {...formItemLayout}>
                  {startTime ? startTime.format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Form.Item>
                <Form.Item  style={formItemStyle} label="Finished Time:" {...formItemLayout}>
                  {renderFinishTime(job)}
                </Form.Item>
                <Form.Item  style={blockStyle} label="Duration" {...formItemLayout}>
                  {computeDuration(startTime, finishTime)}
                </Form.Item>
                <Form.Item  style={formItemStyle} label="Group:" {...formItemLayout}>
                  {job.groupName || '-'}
                </Form.Item>
                <Form.Item  style={formItemStyle} label="Instance type:" {...formItemLayout}>
                  {get(job, 'instanceType.displayName', '') || get(job, 'instanceType.name', '')}
                  <span style={{
                    display: "block",
                    marginTop: -12
                  }}>
                    (CPU: {get(job, 'instanceType.cpuLimit', '-')} / Memory: {get(job, 'instanceType.memoryLimit', '-')}G / GPU: {get(job, 'instanceType.gpuLimit', '-')})
                  </span>
                </Form.Item>
                <Form.Item  style={blockStyle} label="Image:" {...formItemLayout}>
                  {job.image || '-'}
                </Form.Item>
                <Form.Item  style={formItemStyle} label="Command:"  {...formItemLayout}>
                  <Input.TextArea
                    style={{
                      background: 'black',
                      color: '#ddd',
                      fontFamily: 'monospace',
                    }}
                    rows={5}
                    value={job.command}
                  />
                </Form.Item>
              </Form>
            </TabPane>
            <TabPane key="logs" tab="Logs" disabled={job.phase === Phase.Pending || !job.logEndpoint}>
              <Log endpoint={job.logEndpoint}/>
            </TabPane>
          </Tabs>
        </PageBody>
      </>
    )
  }
}

export function computeDuration(start: Moment | '', finish: Moment | '') {
  if (!start || !finish) return '-';
  const duration = moment.duration(finish.diff(start));
  const hour = ensureFormat(Math.floor(duration.asHours()));
  const minutes = ensureFormat(duration.minutes());
  const seconds = ensureFormat(duration.seconds());
  return `${hour}:${minutes}:${seconds}`;
}

function ensureFormat(str) {
  str = str < 0 ? 0 : str;
  str = String(str);
  return str.length === 1 ? `0${str}` : str;
}