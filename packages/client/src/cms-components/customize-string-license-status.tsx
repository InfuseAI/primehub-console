import * as React from 'react';
import { Tag } from 'antd';

export default class LicenseStatus extends React.Component {
  constructor(props) {
    super(props);
  }

  getStatusColor(status) {
    status = status.toLowerCase();
    switch (status) {
      case 'unexpired':
        return 'blue';
      case 'invalid':
        return 'red';
      case 'expired':
        return 'orange';
      default:
        return undefined;
    }
  }

  showStatus(status) {
    status = status.toLowerCase();
    switch (status) {
      case 'unexpired':
        return 'Activated';
      case 'invalid':
        return 'Unauthorized';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  }

  render() {
    const {uiParams} = this.props;
    return <Tag color={this.getStatusColor(uiParams.data)}>{this.showStatus(uiParams.data)}</Tag>;
  }
}
