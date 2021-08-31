import { BrowserRouter, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react'
import { Modal, Button, Icon, notification } from 'antd';
import * as React from 'react';
import './tracker.css';
import { divide } from 'lodash';

const initialState = { 'pageChanges': 0, 'collected': false, 'location': '', 'prompt': 0 };
const key = 'primehub:ce:collector';

const saveState = (s) => {
  window.localStorage.setItem(key, JSON.stringify(s));
}

const getState = () => {
  return JSON.parse(window.localStorage.getItem(key));
}

const updatePageChange = (location: string, setDisplay: Function) => {

  let currentState;

  if (window.localStorage.getItem(key) == null) {
    currentState = initialState;
  } else {
    try {
      currentState = getState();
    } catch (error) {
      currentState = initialState;
    }
  }

  if (currentState['collected'] === true) {
    // feedback has already done.
    return;
  }

  if (currentState['location'] == '') {
    currentState['location'] = location;
    saveState(currentState);
  } else if (currentState['location'] !== location) {
    currentState['location'] = location;
    currentState['pageChanges'] += 1;
    saveState(currentState);
  }

  const { prompt, pageChanges } = currentState;

  if (prompt >= 2) {
    setDisplay({ show: true, type: 'notification' });
    currentState['prompt'] += 1;
    saveState(currentState);
  } else if (prompt === 0 && pageChanges >= 3) {
    setDisplay({ show: true, type: 'modal' });
    currentState['prompt'] += 1;
    saveState(currentState);
  } else if (prompt === 1 && pageChanges >= 30) {
    setDisplay({ show: true, type: 'modal' });
    currentState['prompt'] += 1;
    saveState(currentState);
  }

}

const CommunityList = (props) => {
  const { userTakeAction } = props;
  return (
    <div>
      <p><Icon type="twitter" /><a href="https://twitter.com/intent/tweet?text=%40infuseai%20PrimeHub%20is%20awesome%21" target="_blank" onClick={userTakeAction}>Share To Twitter</a></p>
      <p><Icon type="user-add" /><a href="https://discord.gg/G2kudBanAa" target="_blank" onClick={userTakeAction}>Join our Discord</a></p>
    </div>
  )
}

const PageChangeTracker = (props) => {
  if (primehubCE !== true) {
    return (
      <span></span>
    )
  }

  const analytics = window['analytics'] || null;
  if (analytics == null) {
    console.log('Cannot find the analytics');
    return (<span></span>)
  }

  let location = useLocation();
  const [display, setDisplay] = useState({ show: false, type: 'modal' });

  useEffect(() => {
    updatePageChange(window.location.href, setDisplay);
  }, [location]);

  const userTakeAction = () => {
    const s = getState();
    s['collected'] = true;
    s['anonymousId'] = getClusterId();
    analytics.track("CEUserFeedback", s);
    saveState(s);
    setDisplay({ show: false, type: display.type });
    return true;
  }

  const getClusterId = () => {
    const g = document.cookie.match(/primehubAnonymousId=([^; ]+).*;?/);
    if (g == null) {
      return "";
    }
    return g[1];
  };

  const title: string = 'Talk to PrimeHub';
  if (display.show !== true) {
    return (<div></div>)
  }

  if (display.type === 'modal') {
    return (
      <div>
        <Modal key='prompt-modal'
          title={title}
          visible={display.show}
          footer={[
            <Button
              href="#"
              type='primary'
              onClick={() => {
                setDisplay({ show: false, type: display.type });
              }}
            >
              OK
            </Button>
          ]}>
          <CommunityList userTakeAction={userTakeAction} />
        </Modal>
      </div>
    )
  } else {
    notification.open({
      key: 'prompt-notification',
      message: `${title}`,
      placement: 'bottomRight',
      duration: 0,
      description: <CommunityList userTakeAction={userTakeAction} />
    });

    return (
      <div>
      </div>
    );
  }

}

export default PageChangeTracker;
