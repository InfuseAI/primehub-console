import React from 'react';
import { Alert } from 'antd';

export default class GroupSettingsAlert extends React.PureComponent {

  render() {
    return <Alert
           message='These settings can be updated in Admin Portal'
           description='Please update them in Admin Portal or contact the administrator.'
           type='warning'
           showIcon />;
  }
}
