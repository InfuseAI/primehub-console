import { useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { Modal, Button, Icon, notification } from 'antd';

const CommunityList = props => {
  const { userTakeAction } = props;
  return (
    <div>
      <p>
        <Icon type='twitter' />
        &nbsp;
        <a
          href='https://bit.ly/38vv6JG'
          target='_blank'
          onClick={() => {
            userTakeAction('twitter');
          }}
          rel='noreferrer'
        >
          Share your experience to us on Twitter
        </a>
      </p>
      <p>
        <Icon type='user-add' />
        &nbsp;
        <a
          href='https://bit.ly/3DHxMlQ'
          target='_blank'
          onClick={() => {
            userTakeAction('discord');
          }}
          rel='noreferrer'
        >
          Join our Discord community
        </a>
      </p>
    </div>
  );
};

const PageChangeTracker = props => {
  if (primehubCE !== true) {
    return <></>;
  }

  const analytics = window.analytics || null;
  if (analytics == null) {
    return <></>;
  }

  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [promptType, setPromptType] = useState('modal');
  const [event, setEvent] = useLocalStorage('primehub:ce:collector', {
    pageChanges: 0,
    collected: false,
    location: '',
    prompt: 0,
  });

  const updatePageChange = () => {
    const { collected, location, prompt, pageChanges } = event;
    if (collected === true) {
      // feedback has already done.
      return;
    }

    if (location === '') {
      event.location = window.location.href;
      setEvent(event);
      return;
    } else if (location !== location) {
      event.location = location;
    }

    if (prompt >= 2) {
      setPromptType('notification');
      setVisible(true);
      event.prompt += 1;
    } else if (prompt === 0 && pageChanges >= 5) {
      setPromptType('modal');
      setVisible(true);
      event.prompt += 1;
    } else if (prompt === 1 && pageChanges >= 30) {
      setPromptType('modal');
      setVisible(true);
      event.prompt += 1;
    }

    event.pageChanges += 1;
    setEvent(event);
  };

  useEffect(() => {
    updatePageChange();
  }, [location]);

  const userTakeAction = (shareTo: string) => {
    const s = event;
    s['collected'] = true;
    s['anonymousId'] = window.primehubAnonymousId || '';
    s['shareTo'] = shareTo;
    analytics.track('CEUserFeedback', s);
    setEvent(s);
  };

  const title = 'Thanks for using PrimeHub! Any thing you want to share?';
  if (visible !== true) {
    return <></>;
  }

  if (promptType === 'modal') {
    return (
      <Modal
        key='prompt-modal'
        title={title}
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
        footer={[
          <Button
            href='#'
            type='primary'
            onClick={() => {
              setVisible(false);
            }}
          >
            OK
          </Button>,
        ]}
      >
        <CommunityList userTakeAction={userTakeAction} />
      </Modal>
    );
  } else {
    notification.open({
      key: 'prompt-notification',
      message: `${title}`,
      placement: 'bottomRight',
      duration: 0,
      description: <CommunityList userTakeAction={userTakeAction} />,
    });

    return <></>;
  }
};

export default PageChangeTracker;
