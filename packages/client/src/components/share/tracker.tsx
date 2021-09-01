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
    if (event.collected === true) {
      // feedback has already done.
      return;
    }

    const location = window.location.href;
    if (event.location === '') {
      event.location = location;
      setEvent(event);
      return ;
    } else if (event.location !== location) {
      event.location = location;
      event.pageChanges += 1;
    }

    const { prompt, pageChanges } = event;
    if (prompt >= 2) {
      setPromptType('notification');
    } else if (prompt === 0 && pageChanges >= 5) {
      setPromptType('modal');
    } else if (prompt === 1 && pageChanges >= 30) {
      setPromptType('modal');
    }

    event.prompt += 1;
    setVisible(true);
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
