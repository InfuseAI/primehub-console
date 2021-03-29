import React from 'react';
import { get  } from 'lodash';
import { Checkbox, Table } from 'antd';

interface Props {
  group: any;
}

export default class GroupSettingsMembers extends React.Component<Props> {

  render() {
    const {group} = this.props;

    if (!group) {
      return (<div>loading...</div>);
    }

    const admins = get(group, 'admins', []).split(',');
    const users = get(group, 'users', []).map(user => {
      return {
        username: user.username,
        admin: admins.includes(user.username),
      };
    });

    const columns = [
      {
        title: 'Username',
        dataIndex: 'username',
        key: 'username',
      },
      {
        title: 'Group Admin',
        dataIndex: 'admin',
        key: 'admin',
        render: (value) => <Checkbox checked={value} disabled />,
      },
    ];

    return <Table dataSource={users} columns={columns} style={{marginTop: 15}}/>;
  }

}
