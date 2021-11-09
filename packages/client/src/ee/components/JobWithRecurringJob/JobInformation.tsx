import React from 'react';
import get from 'lodash/get';
import styled from 'styled-components';
import moment from 'moment';
import { Button, Tabs, Input, Divider, Modal } from 'antd';
import { Link } from 'react-router-dom';

import Log from 'components/share/log';
import Message from 'components/share/message';
import InfuseButton from 'components/infuseButton';
import Field from 'components/share/field';
import JobArtifact from 'ee/containers/jobArtifact';
import JobMonitoring from 'ee/containers/jobMonitoring';

import { getActionByPhase, computeDuration } from './utils';
import type { Job } from './types';

const MAX_MESSAGE = 60;
const POD_FAILED = 'PodFailed';
const blockStyle = {
  marginBottom: 36,
};

const JobStatus = styled.div`
  table {
    margin: 15px auto;
    margin-bottom: 0;
    width: 90%;
    border-collapse: separate;
    border-spacing: 10px 0;
  }
  thead,
  tbody {
    background: #f8f8f8;
  }
  thead th {
    width: auto;
    font-size: 14px;
    color: #aaaaaa;
    padding: 5px 10px;
    font-weight: 400;
  }
  tbody td {
    width: auto;
    padding: 5px 10px;
    padding-top: 0;
    font-size: 14pt;
  }
`;

function renderMessage(job?: Job) {
  if (!job) {
    return null;
  }

  if (job.cancel || job.phase === 'Cancelled') {
    return 'Cancelled by user';
  }

  switch (job.phase) {
    case 'Succeeded':
      return <Message text={job.message} /> || 'Job Complete';
    case 'Failed':
      if (job.reason === POD_FAILED) {
        return (
          <Message
            text={job.message}
            extra={
              <span>
                Please see <b>Logs</b> tab for more details
              </span>
            }
          />
        );
      }

      if (!job.message) {
        return (
          <span>
            <b>[System Error]</b> {job.reason}
          </span>
        );
      }

      // eslint-disable-next-line no-case-declarations
      const lastLine = (job.message || '').replace(/\n$/, '').split('\n').pop();

      if (lastLine.length < MAX_MESSAGE) {
        return (
          <span>
            <b>[Runtime Error]</b> {lastLine}
          </span>
        );
      }

      return (
        <span>
          <b>[Runtime Error]</b> {lastLine.substr(0, MAX_MESSAGE)}... Find more
          info in <b>Logs</b> tab
        </span>
      );
    default:
      return <Message text={job.message} /> || '-';
  }
}

function renderFinishTime(job?: Job) {
  if (!job) {
    return '-';
  }

  if (job.phase === 'Running') {
    return '-';
  }

  return job.finishTime
    ? moment(job.finishTime).format('YYYY-MM-DD HH:mm:ss')
    : '-';
}

function finishTimeFromNow(job?: Job) {
  if (!job) {
    return '-';
  }

  if (job.phase === 'Running') {
    return '-';
  }

  return job.finishTime ? moment(job.finishTime).fromNow() : '-';
}

interface Props {
  job: Job | undefined;
  rerunPhJob: (id: string) => void;
  cancelPhJob: (id: string) => void;
  cloneJob: (job: Job) => void;
}

export function JobInformation({ job, ...props }: Props) {
  const createTime = job?.createTime ? moment(job.createTime) : null;
  const startTime = job?.startTime ? moment(job.startTime) : null;
  const finishTime = job?.finishTime ? moment(job.finishTime) : null;
  const action = getActionByPhase(job?.phase);

  function allowPersistLog() {
    const enableLogPersistence = window?.enableLogPersistence || false;

    if (!enableLogPersistence) {
      return false;
    }

    switch (job?.phase) {
      case 'Succeeded':
      case 'Failed':
      case 'Cancelled':
        return true;
      default:
        return false;
    }
  }

  function handleJobAction(action: 'Cancel' | 'Rerun') {
    if (action === 'Cancel') {
      return Modal.confirm({
        title: 'Cancel',
        content: (
          <>
            Do you want to cancel <b>{job?.displayName}</b>?
          </>
        ),
        iconType: 'info-circle',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        maskClosable: true,
        onOk: () => {
          props.cancelPhJob(job?.id);
        },
      });
    }

    if (action === 'Rerun') {
      return Modal.confirm({
        title: 'Rerun',
        content: (
          <>
            Do you want to rerun <b>{job?.displayName}</b>?
          </>
        ),
        iconType: 'info-circle',
        okText: 'Yes',
        cancelText: 'No',
        maskClosable: true,
        onOk: () => {
          props.rerunPhJob(job?.id);
        },
      });
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button.Group>
          {action.toLowerCase() === 'cancel' ? (
            <InfuseButton onClick={() => handleJobAction(action)}>
              {action}
            </InfuseButton>
          ) : (
            [
              <InfuseButton
                key='action'
                onClick={() => handleJobAction(action)}
              >
                {action}
              </InfuseButton>,
              <InfuseButton key='clone' onClick={() => props.cloneJob(job)}>
                Clone
              </InfuseButton>,
            ]
          )}
        </Button.Group>
      </div>

      <JobStatus>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Duration</th>
              <th>Finished</th>
              <th>Schedule</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{job?.phase}</td>
              <td>{computeDuration(startTime, finishTime)}</td>
              <td>{finishTimeFromNow(job)}</td>
              <td>
                {job?.schedule ? (
                  <Link to={`../recurringJob/${job.schedule}`}>
                    {job.schedule}
                  </Link>
                ) : (
                  '-'
                )}
              </td>
              <td>{job?.userName || '-'}</td>
            </tr>
          </tbody>
        </table>
      </JobStatus>
      <Divider style={{ margin: '14px 0 10px' }} />
      <Tabs>
        <Tabs.TabPane key='information' tab='Information'>
          <div style={{ padding: '16px 36px' }}>
            <Field
              labelCol={4}
              valueCol={20}
              label='Message'
              value={renderMessage(job)}
            />
            <Divider />
            <Field labelCol={4} valueCol={20} label='Job ID' value={job?.id} />
            <Field
              labelCol={4}
              valueCol={20}
              label='Job Name'
              value={job?.displayName || '-'}
            />
            <Field
              labelCol={4}
              valueCol={20}
              label='Creation Time'
              value={
                createTime ? createTime.format('YYYY-MM-DD HH:mm:ss') : '-'
              }
            />
            <Field
              labelCol={4}
              valueCol={20}
              label='Start Time'
              value={startTime ? startTime.format('YYYY-MM-DD HH:mm:ss') : '-'}
            />
            <Field
              labelCol={4}
              valueCol={20}
              label='Finished Time'
              value={renderFinishTime(job)}
            />
            <Field
              labelCol={4}
              valueCol={20}
              label='Group'
              value={job?.groupName || '-'}
            />
            <Field
              labelCol={4}
              valueCol={20}
              label='Instance Type'
              value={
                <div>
                  {get(job, 'instanceType.displayName', '') ||
                    get(job, 'instanceType.name', '')}
                  <br />
                  (CPU: {get(job, 'instanceType.cpuLimit', '-')} / Memory:{' '}
                  {get(job, 'instanceType.memoryLimit', '-')}G / GPU:{' '}
                  {get(job, 'instanceType.gpuLimit', '-')})
                </div>
              }
            />
            <Field
              labelCol={4}
              valueCol={20}
              style={blockStyle}
              label='Image'
              value={job?.image || '-'}
            />
            <Field
              style={{ marginTop: 32 }}
              type='vertical'
              label='Command'
              value={
                <Input.TextArea
                  style={{
                    background: 'black',
                    color: '#ddd',
                    fontFamily: 'monospace',
                  }}
                  rows={5}
                  value={job?.command}
                />
              }
            />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane
          key='artifact'
          tab='Artifacts'
          disabled={job?.phase !== 'Failed' && job?.phase !== 'Succeeded'}
        >
          <JobArtifact jobId={job?.id}></JobArtifact>
        </Tabs.TabPane>
        <Tabs.TabPane key='monitoring' tab='Monitoring'>
          <JobMonitoring jobId={job?.id}></JobMonitoring>
        </Tabs.TabPane>
        <Tabs.TabPane
          key='logs'
          tab='Logs'
          disabled={job?.phase === 'Pending' || !job?.logEndpoint}
        >
          <Log endpoint={job?.logEndpoint} allowPersistLog={allowPersistLog} />
        </Tabs.TabPane>
      </Tabs>
    </>
  );
}
