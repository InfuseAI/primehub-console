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

const initSurvey = () => {
  (() => {
    window.SS_WIDGET_TOKEN = 'tt-6da14e';
    window.SS_ACCOUNT = 'infuseai.surveysparrow.com';
    window.SS_SURVEY_NAME = 'PrimeHub';
    if (!document.getElementById('ss-widget')) {
      const launcher = () => {
        launcher.update(arguments);
      };
      launcher.args = [];
      launcher.update = e => {
        launcher.args.push(e);
      };
      window.SparrowLauncher = launcher;
      const s = document.getElementsByTagName('script');
      const c = s[s.length - 1];
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = !0;
      script.id = 'ss-widget';
      script.src = [
        'https://',
        'infuseai.surveysparrow.com/widget/',
        window.SS_WIDGET_TOKEN,
      ].join('');
      c.parentNode.insertBefore(script, c);
    }
  })();
};

const NPSSurvey = () => {
  return <div id='ss_survey_widget'></div>;
};

const PageChangeTracker = () => {
  const analytics = window.analytics || null;
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
      setVisible(false);
      return;
    }

    const href = window.location.href;
    if (location === '') {
      event.location = href;
      setEvent(event);
      return;
    } else if (location !== href) {
      event.location = href;
    }

    if (prompt >= 2 && !window.enableNPSSurvey) {
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

  const userTakeAction = (shareTo: string) => {
    const s = event;
    s['collected'] = true;
    s['anonymousId'] = window.primehubAnonymousId || '';
    s['shareTo'] = shareTo;
    analytics.track('CEUserFeedback', s);
    setEvent(s);
  };

  const title = 'Thanks for using PrimeHub! Anything you want to share?';

  useEffect(() => {
    updatePageChange();
  }, [location]);

  useEffect(() => {
    if (visible && window.enableNPSSurvey) {
      initSurvey();
    }
  }, [visible]);

  if (primehubCE !== true && !window.enableNPSSurvey) {
    return <></>;
  }

  if (analytics == null) {
    return <></>;
  }

  if (visible !== true || event.collected) {
    return <></>;
  }

  if (promptType === 'modal') {
    return (
      <Modal
        key='prompt-modal'
        title={title}
        visible={visible}
        width={820}
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
        {window.enableNPSSurvey ? <NPSSurvey /> : <></>}
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
