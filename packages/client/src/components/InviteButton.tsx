import React, { useState, useEffect } from 'react';
import { Button, Input, Icon, Modal, notification } from 'antd';
import { useClipboard } from 'hooks/useClipboard';
import { useRoutePrefix } from 'hooks/useRoutePrefix/useRoutePrefix';

interface InviteButtonProps {
  groupId: string;
  onRequestToken: (
    id: string
  ) => Promise<{ data: { createInvitation: { invitationToken: string } } }>;
}

const InviteButton = ({ groupId, onRequestToken }: InviteButtonProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [, copy] = useClipboard({ lazy: true, timeout: 2000 });
  const { appPrefix } = useRoutePrefix();

  useEffect(() => {
    if (isRequesting) {
      setInviteLink('');
    }
  }, [isRequesting]);

  return (
    <>
      <Button
        icon='user-add'
        onClick={() => {
          setVisible(true);
        }}
      >
        Invite Users
      </Button>
      <Modal
        title='Share an invite link'
        visible={visible}
        okButtonProps={{
          disabled: isRequesting,
        }}
        cancelButtonProps={{
          disabled: isRequesting,
        }}
        onOk={() => {
          setVisible(false);
        }}
        onCancel={() => {
          setVisible(false);
        }}
      >
        <div>
          <p>Anyone can request invitation link to create a new account.</p>
          <p>The link will be expired after 1 day or a new accound created.</p>
          <Input
            disabled={!inviteLink}
            readOnly={!!inviteLink}
            value={inviteLink}
            onFocus={() => {
              copy(inviteLink);
              notification.success({
                duration: 3,
                placement: 'bottomRight',
                message: 'Copied!',
              });
            }}
            addonAfter={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '84px',
                  cursor: 'pointer',
                }}
                onClick={async () => {
                  setIsRequesting(true);

                  const {
                    data: {
                      createInvitation: { invitationToken },
                    },
                  } = await onRequestToken(groupId);

                  setIsRequesting(false);
                  setInviteLink(
                    `${window.cmsHost}${appPrefix}invite/${invitationToken}`
                  );
                }}
              >
                {isRequesting ? <Icon type='loading' /> : 'Request Link'}
              </div>
            }
          />
        </div>
      </Modal>
    </>
  );
};

export default InviteButton;
