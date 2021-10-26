import * as React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { Tag, Icon, Divider, Spin, Modal, notification, Tooltip } from 'antd';

import { useClipboard } from 'hooks/useClipboard';
import { usePrevious } from 'hooks/usePrevious';
import { Status } from 'ee/components/modelDeployment/common';
import type { DeploymentInfo } from 'ee/components/modelDeployment/common';

const Card = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 2px;
`;

const Title = styled.div`
  font-size: 21px;
  line-height: 32px;
  color: rgba(0, 0, 0, 0.85);
  max-width: 265px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardButton = styled.div<{ loading?: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  width: 180px;
  margin: 12px 0;

  cursor: ${props => (props.loading ? 'not-allowed' : 'pointer')};

  &:hover {
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.02);
  }
`;

const DEPLOYMENT_STATUS = {
  [Status.Deployed]: 'green',
  [Status.Deploying]: 'gold',
  [Status.Stopped]: '#AAAAAA',
  [Status.Stopping]: 'orange',
  [Status.Failed]: 'red',
};

interface Props
  extends Pick<
    DeploymentInfo,
    'id' | 'name' | 'status' | 'endpoint' | 'lastUpdatedTime' | 'history'
  > {
  onStart?: () => void;
  onStop?: () => void;
}

export function DeploymentCard({ endpoint, ...props }: Props) {
  const [isLoading, setIsLoading] = React.useState(false);
  const previousStatus = usePrevious(props.status);
  const history = useHistory();
  const [status, copyEndpoint] = useClipboard({
    text: endpoint,
  });

  const [latest] = props.history || [];
  const isStoppted = props.status === Status.Stopped;

  // Imitation of loading status, because mutation didn't provide loading status.
  React.useEffect(() => {
    if (props.status !== previousStatus) {
      setIsLoading(false);
    }
  }, [previousStatus, props.status]);

  React.useEffect(() => {
    if (status === 'copied') {
      notification.success({
        message: 'Copied!',
        placement: 'bottomRight',
        duration: 3,
      });
    }
  }, [status]);

  return (
    <Card id={props.id}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px 0px 24px',
        }}
      >
        <Tooltip placement='top' title={props.name}>
          <Title>{props.name}</Title>
        </Tooltip>
        <Tag style={{ cursor: 'auto' }} color={DEPLOYMENT_STATUS[props.status]}>
          {props.status}
        </Tag>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 24px 0px',
          gap: '0.5rem',
          height: '85px',
        }}
      >
        <div style={{ display: 'flex' }}>
          <div style={{ width: '40%', fontSize: '14px', lineHeight: '20px' }}>
            Endpoint:
          </div>{' '}
          <a onClick={() => copyEndpoint()} style={{ lineHeight: '20px' }}>
            Copy URL
          </a>
        </div>

        <div style={{ display: 'flex' }}>
          <div style={{ width: '40%', fontSize: '14px', lineHeight: '20px' }}>
            Last Updated:
          </div>{' '}
          <div
            style={{
              width: '60%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '20px',
            }}
          >
            {moment(latest.time).fromNow()} by{' '}
            <b>{latest.deployment.userName}</b>
          </div>
        </div>
      </div>

      <Divider style={{ margin: '24px 0px 0px' }} />

      <div
        className='deployment-actions'
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          height: '60px',
        }}
      >
        <CardButton
          onClick={() => {
            history.push(`deployments/${props.id}`);
          }}
        >
          <Icon type='setting' style={{ fontSize: '1rem' }} /> Manage
        </CardButton>

        <Divider type='vertical' style={{ height: '36px', margin: '12px 0' }} />

        <CardButton
          loading={+isLoading}
          onClick={() => {
            setIsLoading(true);

            Modal.confirm({
              title: isStoppted ? 'Start Deploy' : 'Stop Deploy',
              maskClosable: true,
              content: (
                <p>
                  Do you want to {isStoppted ? 'start' : 'stop'} "
                  <b>{props.name}</b>"?
                </p>
              ),
              onOk: () => {
                if (isStoppted) {
                  props?.onStart();
                } else {
                  props?.onStop();
                }
              },
              onCancel: () => {
                setIsLoading(false);
              },
            });
          }}
        >
          {isLoading ? (
            <Spin />
          ) : (
            <>
              <Icon
                type={isStoppted ? 'play-circle' : 'stop'}
                style={{ fontSize: '1rem' }}
              />{' '}
              {isStoppted ? 'Start' : 'Stop'}
            </>
          )}
        </CardButton>
      </div>
    </Card>
  );
}
