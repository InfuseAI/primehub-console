import React from 'react';
import { Alert } from 'antd';

export default class GroupSettingsAlert extends React.PureComponent {

  render() {
    return <Alert
           message='Only system admins can update these settings'
           description='Please contact your administrator to configure these settings.'
           type='warning'
           showIcon />;
  }
}
