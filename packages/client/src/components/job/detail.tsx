import * as React from 'react';
import {Tabs, Input, Modal, Divider} from 'antd';
import {Link} from 'react-router-dom';
import {get} from 'lodash';
import styled from 'styled-components';
import moment, { Moment } from 'moment';
import Log from '../share/log';
import {getActionByPhase, Phase} from 'components/job/phase';
import Title from 'components/job/title';
import Message from 'components/share/message';
import JobBreadcrumb from 'components/job/breadcrumb';
import {History} from 'history';
import {appPrefix} from 'utils/env';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import Field from 'components/share/field';

const TabPane = Tabs.TabPane;

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
            <div style={{padding: '16px 36px'}}>
              <Field labelCol={4} valueCol={20} label="Status" value={<strong>{job.phase}</strong>} />
              <Field labelCol={4} valueCol={20} label="Message" value={renderMessage(job)} />
              <Divider />
              <Field labelCol={4} valueCol={20} label="Job ID" value={job.id} />
              <Field labelCol={4} valueCol={20} label="Job name" value={job.displayName || '-'} />
              <Field labelCol={4} valueCol={20} label="Schedule" value={
                job.schedule ? (
                  <Link to={`${appPrefix}schedule/${job.schedule}`}>
                    {job.schedule}
                  </Link>
                ) : '-'
              }/>
              <Field labelCol={4} valueCol={20} label="User" value={job.userName || '-'} />
              <Field labelCol={4} valueCol={20} label="Creation Time:" value={createTime ? createTime.format('YYYY-MM-DD HH:mm:ss') : '-'} />
              <Field labelCol={4} valueCol={20} label="Start Time:" value={startTime ? startTime.format('YYYY-MM-DD HH:mm:ss') : '-'} />
              <Field labelCol={4} valueCol={20} label="Finished Time:" value={renderFinishTime(job)} />
              <Field labelCol={4} valueCol={20} label="Duration" style={blockStyle} value={computeDuration(startTime, finishTime)} />
              <Field labelCol={4} valueCol={20} label="Group:" value={job.groupName || '-'} />
              <Field labelCol={4} valueCol={20} label="Instance type:" value={(
                <div>
                  {get(job, 'instanceType.displayName', '') || get(job, 'instanceType.name', '')}
                  <br />
                  (CPU: {get(job, 'instanceType.cpuLimit', '-')} / Memory: {get(job, 'instanceType.memoryLimit', '-')}G / GPU: {get(job, 'instanceType.gpuLimit', '-')})
                </div>)}
              />
              <Field labelCol={4} valueCol={20} style={blockStyle} label="Image:" value={job.image || '-'} />
              <Field style={{marginTop: 32}} type="vertical" label="Command:"  value={(
                <Input.TextArea
                  style={{
                    background: 'black',
                    color: '#ddd',
                    fontFamily: 'monospace',
                  }}
                  rows={5}
                  value={job.command}
                />
              )} />
            </div>

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