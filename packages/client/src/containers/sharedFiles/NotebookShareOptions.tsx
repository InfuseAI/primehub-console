import React, { useEffect, useRef, useState } from 'react';
import './nbviewer.css';

import styled from 'styled-components';
import logo from 'images/primehub-logo-w.svg';
import { Button, Divider, Icon, Input, Switch } from 'antd';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { errorHandler } from 'utils/errorHandler';
import { compose } from 'recompose';
import { useClipboard } from 'hooks/useClipboard';

interface SharingOptionsProps {
  hidden?: boolean;
  onCancel?: Function;
  previewFile?: string;
  inGroupPreview: boolean;
  data?: any;
}

interface ShareSwitchProps {
  data?: any;
  sharePosition: any;
  setShareVisible: Function;
  previewFile?: string;
  shareFile: Function;
  unshareFile: Function;
}

interface SharedStatus {
  shared: boolean;
  shareLink?: string;
}

const notificationWidth = 410;

function ShareSwitch(props: ShareSwitchProps) {
  const { data } = props;
  const [sharedStatus, setSharedStatus] = useState<SharedStatus>({
    shared: false,
  });
  const [copyStatus, copy] = useClipboard({ lazy: true, timeout: 2000 });

  useEffect(() => {
    if (data) {
      setSharedStatus(data.sharedFile);
    }
  }, [props.data]);

  return (
    <div
      className='ant-notification'
      style={{
        top: props.sharePosition.top,
        left: props.sharePosition.left,
        margin: 0,
        transition: null,
      }}
    >
      <span>
        <div
          className='ant-notification-notice'
          style={{ width: notificationWidth }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>Anyone outside the group can view the link</div>
            <Switch
              loading={data.loading}
              checked={sharedStatus.shared}
              onChange={status => {
                const { shareFile, unshareFile } = props;
                const callback = status ? shareFile : unshareFile;
                const variables = {
                  where: {
                    ...previewFileToVaraibles(props.previewFile),
                  },
                };

                callback({ variables }).then(result => {
                  const status =
                    result.data.shareFile || result.data.unshareFile;
                  setSharedStatus(status);
                });
              }}
            />
          </div>
          <div>
            <Input
              disabled
              style={{ marginBottom: 16 }}
              value={sharedStatus.shareLink}
              addonAfter={
                <a
                  onClick={() => {
                    if (!sharedStatus.shared) {
                      return;
                    }
                    copy(sharedStatus.shareLink);
                  }}
                  style={{ color: 'black' }}
                >
                  {copyStatus === 'inactive' ? 'Copy' : 'Copied'}
                </a>
              }
            />
          </div>
          <Divider
            style={{
              margin: 0,
              marginBottom: 10,
              width: notificationWidth,
              left: -30,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            <Button
              type='primary'
              onClick={() => {
                props.setShareVisible(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </span>
    </div>
  );
}

function SharingOptions(props: SharingOptionsProps) {
  const optionsRef = useRef();

  const headerHeight = 64;
  const [shareVisible, setShareVisible] = useState(false);
  const [sharePosition, setSharePosition] = useState({ top: 0, left: 0 });

  const Logo = styled.div`
    background-image: url(${logo});
    background-color: #373d62;
    background-size: 65%;
    background-position: 14px 13px;
    background-repeat: no-repeat;
    width: 200px;
    height: ${headerHeight}px;
  ` as any;

  if (props.hidden) {
    return <></>;
  }

  return (
    <div
      className='header_container'
      style={{ backgroundColor: '#373d62' }}
      ref={optionsRef}
    >
      <Logo />
      <div
        className='header_operations'
        style={{ visibility: props.inGroupPreview ? 'visible' : 'hidden' }}
      >
        <a
          onClick={() => {
            const rect = optionsRef.current.getBoundingClientRect();
            const y = rect.y + headerHeight + 10;
            const left = rect.x + rect.width - notificationWidth - 25;
            setShareVisible(true);
            setSharePosition({ top: y, left: left });
          }}
        >
          <Icon type='share-alt' className='header_icon' />
        </a>

        <a
          onClick={() => {
            if (props.onCancel) {
              props.onCancel();
            }
          }}
        >
          <Icon type='close-circle' className='header_icon' />
        </a>
      </div>
      {props.data && props.data.sharedFile && shareVisible && (
        <ShareSwitch
          {...props}
          sharePosition={sharePosition}
          setShareVisible={setShareVisible}
        />
      )}
    </div>
  );
}

const CHECK_SHARED_STATUS = gql`
  query files($where: SharedFileWhereUniqueInput!) {
    sharedFile(where: $where) {
      shareLink
      hash
      shared
    }
  }
`;

const SHARE_FILE = gql`
  mutation files($where: SharedFileWhereUniqueInput!) {
    shareFile(where: $where) {
      shareLink
      hash
      shared
    }
  }
`;

const UNSHARE_FILE = gql`
  mutation files($where: SharedFileWhereUniqueInput!) {
    unshareFile(where: $where) {
      shareLink
      hash
      shared
    }
  }
`;

const previewFileToVaraibles = previewFile => {
  if (!previewFile) {
    return {};
  }
  const result = previewFile.match('/files/groups/([^/]+)/(.+)');
  const [groupName, phfsPath] = result.slice(1);
  return { groupName: groupName, phfsPath: phfsPath };
};

export default compose(
  graphql(CHECK_SHARED_STATUS, {
    skip: (props: SharingOptionsProps) => {
      return props.inGroupPreview !== true;
    },
    options: (props: SharingOptionsProps) => ({
      variables: {
        where: {
          ...previewFileToVaraibles(props.previewFile),
        },
      },
      // fetchPolicy: 'network-only',
      onError: errorHandler,
    }),
  }),
  graphql(SHARE_FILE, {
    name: 'shareFile',
    skip: (props: SharingOptionsProps) => {
      return props.inGroupPreview !== true;
    },
    options: (props: SharingOptionsProps) => ({
      onError: errorHandler,
      refetchQueries: [
        {
          query: CHECK_SHARED_STATUS,
          variables: {
            where: {
              ...previewFileToVaraibles(props.previewFile),
            },
          },
        },
      ],
    }),
  }),
  graphql(UNSHARE_FILE, {
    name: 'unshareFile',
    skip: (props: SharingOptionsProps) => {
      return props.inGroupPreview !== true;
    },
    options: (props: SharingOptionsProps) => ({
      onError: errorHandler,
      refetchQueries: [
        {
          query: CHECK_SHARED_STATUS,
          variables: {
            where: {
              ...previewFileToVaraibles(props.previewFile),
            },
          },
        },
      ],
    }),
  })
)(SharingOptions);
