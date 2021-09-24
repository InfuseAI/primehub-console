import { Button, Icon, Input, Modal } from 'antd';
import { useClipboard } from 'hooks/useClipboard';
import React from 'react';

const InviteBotton = (props: { isAdmin: boolean; groupId: string }) => {
  const [visible, setVisible] = React.useState(false);
  const inviteLinkPrefix = `${window.cmsHost}${window.APP_PREFIX}invite`;
  const [copyStatus, copy] = useClipboard({ lazy: true, timeout: 2000 });
  if (props.isAdmin !== true) {
    return null;
  }

  const onCreatingInvitation = () => {
    setVisible(!visible);
  };

  const generateToken = () => {
    const length = 32;
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const inviteLink = `${inviteLinkPrefix}/${generateToken()}`;
  return (
    <Button style={{ marginRight: 1 }} onClick={onCreatingInvitation}>
      <Icon type='user-add' />
      Invite Users
      <Modal
        title='Share an invite link'
        visible={visible}
        onOk={() => {
          setVisible(false);
        }}
        onCancel={() => {
          setVisible(false);
        }}
      >
        <div>
          <p>Anyone can use this link to create a new account.</p>
          <p>The link will be expired after 1 day or a new accound created.</p>
          <Input
            disabled
            value={inviteLink}
            addonAfter={
              <a
                onClick={() => {
                  copy(inviteLink);
                }}
              >
                {copyStatus === 'inactive' ? 'Create and Copy' : 'Created'}
              </a>
            }
          />
        </div>
      </Modal>
    </Button>
  );
};

export default InviteBotton;
