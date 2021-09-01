import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react'
import { useLocalStorage } from 'hooks/useLocalStorage';
import { Modal, Button, Icon, notification } from 'antd';
import React from 'react';

const updatePageChange = (state, setState, setDisplay: Function) => {

  if (state['collected'] === true) {
    // feedback has already done.
    return;
  }

  const location = window.location.href;
  if (state['location'] == '') {
    state['location'] = location;
    setState(state);
  } else if (state['location'] !== location) {
    state['location'] = location;
    state['pageChanges'] += 1;
    setState(state);
  }

  const { prompt, pageChanges } = state;

  if (prompt >= 2) {
    setDisplay({ show: true, type: 'notification' });
    state['prompt'] += 1;
    setState(state);
  } else if (prompt === 0 && pageChanges >= 3) {
    setDisplay({ show: true, type: 'modal' });
    state['prompt'] += 1;
    setState(state);
  } else if (prompt === 1 && pageChanges >= 30) {
    setDisplay({ show: true, type: 'modal' });
    state['prompt'] += 1;
    setState(state);
  }

}

const CommunityList = (props) => {
  const { userTakeAction, state, setState } = props;
  return (
    <div>
      <p><Icon type="twitter" /><a href="https://bit.ly/38vv6JG" target="_blank" onClick={() => { userTakeAction(state, setState, 'twitter') }}>Share To Twitter</a></p>
      <p><Icon type="user-add" /><a href="https://bit.ly/3DHxMlQ" target="_blank" onClick={() => { userTakeAction(state, setState, 'discord') }}>Join our Discord</a></p>
    </div>
  )
}

const PageChangeTracker = (props) => {
  if (primehubCE !== true) {
    return (<></>)
  }

  const analytics = window['analytics'] || null;
  if (analytics == null) {
    console.log('Cannot find the analytics');
    return (<></>)
  }

  const location = useLocation();
  const [display, setDisplay] = useState({ show: false, type: 'modal' });

  const initialState = { 'pageChanges': 0, 'collected': false, 'location': '', 'prompt': 0 };
  const [collectedState, setCollectedState] = useLocalStorage('primehub:ce:collector', initialState);

  useEffect(() => {
    updatePageChange(collectedState, setCollectedState, setDisplay);
  }, [location]);

  const userTakeAction = (state, setState, shareTo: string) => {
    const s = state
    s['collected'] = true;
    s['anonymousId'] = window['primehubAnonymousId'] || '';
    s['shareTo'] = shareTo
    analytics.track("CEUserFeedback", s);
    setState(s);

    // close all prompt
    setDisplay({ show: false, type: display.type });
    notification.close('prompt-notification');
    return true;
  }

  const title: string = 'Talk to PrimeHub';
  if (display.show !== true) {
    return (<></>)
  }

  if (display.type === 'modal') {
    return (
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
        <CommunityList userTakeAction={userTakeAction} state={collectedState} setState={setCollectedState} />
      </Modal>
    )
  } else {
    notification.open({
      key: 'prompt-notification',
      message: `${title}`,
      placement: 'bottomRight',
      duration: 0,
      description: <CommunityList userTakeAction={userTakeAction} state={collectedState} setState={setCollectedState} />
    });

    return (<></>);
  }

}

export default PageChangeTracker;
