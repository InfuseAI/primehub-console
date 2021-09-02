import React from 'react';
import { Alert } from 'antd';
import { appPrefix } from 'utils/env';

const { isUserAdmin } = window;

interface Props {
  groupId: string;
}

const AdminPortalLink = (props: Props) => {
  const { groupId } = props;
  return isUserAdmin ? (
    <a href={`${appPrefix}admin/group/${groupId}`}>Admin Portal</a>
  ) : (
    <span>Admin Portal</span>
  );
};

export default class GroupSettingsAlert extends React.PureComponent<Props> {
  render() {
    const { groupId } = this.props;
    return (
      <Alert
        message='These settings can be updated in Admin Portal'
        description={
          <span>
            Please update them in {<AdminPortalLink groupId={groupId} />} or
            contact the administrator.{' '}
          </span>
        }
        type='warning'
        showIcon
      />
    );
  }
}
