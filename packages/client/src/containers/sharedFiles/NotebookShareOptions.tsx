import React, { useEffect, useState } from 'react';
import './nbviewer.css';

import styled from 'styled-components';
import logo from 'images/primehub-logo-w.svg';
import { Button, Divider, Icon, Input, Switch } from 'antd';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { errorHandler } from 'utils/errorHandler';
import { compose } from 'recompose';
import { useClipboard } from 'hooks/useClipboard';

interface ShareAndUnShareVariables {
  variables: {
    where: { groupName: string; phfsPath: string };
  };
}

interface SharingOptionsProps {
  previewFile?: string;
  data?: {
    loading: boolean;
    sharedFile: SharedFile;
  };
  onCancel: () => void;
  shareFile: ({
    variables,
  }: ShareAndUnShareVariables) => Promise<{ data: { shareFile: SharedFile } }>;
  unshareFile: ({ variables }: ShareAndUnShareVariables) => Promise<{
    data: { unshareFile: SharedFile };
  }>;
}

interface SharedFile {
  shared: boolean;
  hash: string | null;
  shareLink: string | null;
}

interface ShareSwitchProps {
  data: SharedFile | null;
  visible: boolean;
  onSwitchChange: (
    status: boolean
  ) => Promise<{ data: { shareFile?: SharedFile; unshareFile?: SharedFile } }>;
  onVisibleChange: () => void;
}

const notificationWidth = 410;

function ShareSwitch({ data, ...props }: ShareSwitchProps) {
  const [sharedStatus, setSharedStatus] = useState<SharedFile>({
    shared: false,
    hash: null,
    shareLink: null,
  });
  const [copyStatus, copy] = useClipboard({ lazy: true, timeout: 2000 });

  useEffect(() => {
    if (data) {
      setSharedStatus(data);
    }
  }, [data]);

  return (
    <div
      className='ant-notification'
      style={{
        position: 'absolute',
        opacity: props.visible ? 1 : 0,
        visibility: props.visible ? 'visible' : 'hidden',
        transition: 'all .3s ease-out',
        top: '79px',
        right: '25px',
      }}
    >
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
            checked={sharedStatus.shared}
            onChange={async status => {
              const result = await props.onSwitchChange(status);
              const nextSharedStatus =
                result.data.shareFile || result.data.unshareFile;

              setSharedStatus(nextSharedStatus);
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
              props.onVisibleChange();
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

const headerHeight = 64;
export const Logo = styled.div`
  background-image: url(${logo});
  background-color: #373d62;
  background-size: 65%;
  background-position: 14px 13px;
  background-repeat: no-repeat;
  width: 200px;
  height: ${headerHeight}px;
`;

function SharingOptions({ data, ...props }: SharingOptionsProps) {
  const [shareVisible, setShareVisible] = useState(false);

  return (
    <div
      className='header_container'
      style={{ position: 'relative', backgroundColor: '#373d62' }}
    >
      <Logo />
      <div
        className='header_operations'
      >
        <Icon
          type='share-alt'
          className='header_icon'
          onClick={() => {
            setShareVisible(true);
          }}
        />

        <Icon
          type='close-circle'
          className='header_icon'
          onClick={() => {
            if (props.onCancel) {
              props.onCancel();
            }
          }}
        />
      </div>

      <ShareSwitch
        data={data.sharedFile}
        visible={shareVisible}
        onVisibleChange={() => setShareVisible(prev => !prev)}
        onSwitchChange={async (status: boolean) => {
          const mutation = status ? props.shareFile : props.unshareFile;
          const variables = {
            where: {
              ...previewFileToVaraibles(props.previewFile),
            },
          };

          try {
            const result = await mutation({
              variables,
            } as ShareAndUnShareVariables);
            return result;
          } catch (err) {
            console.error(err);
          }
        }}
      />
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
  const result = previewFile.match('/files/groups/([^/]+)/(.+)');
  const [groupName, phfsPath] = result.slice(1);
  return { groupName: groupName, phfsPath: phfsPath };
};

export default compose(
  graphql(CHECK_SHARED_STATUS, {
    options: (props: SharingOptionsProps) => ({
      variables: {
        where: {
          ...previewFileToVaraibles(props.previewFile),
        },
      },
      onError: errorHandler,
    }),
  }),
  graphql(SHARE_FILE, {
    name: 'shareFile',
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
