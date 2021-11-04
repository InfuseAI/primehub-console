import React from 'react';
import { get } from 'lodash';
import { Checkbox, Table } from 'antd';
import { TruncateTableField } from 'utils/TruncateTableField';

interface Props {
  group: any;
}

class GroupSettingsMembers extends React.Component<Props> {
  render() {
    const { group } = this.props;

    if (!group) {
      return <div>loading...</div>;
    }

    const admins = get(group, 'admins', []).split(',');
    const users = get(group, 'users', []).map(user => {
      return {
        id: user.id,
        username: user.username,
        admin: admins.includes(user.username),
      };
    });

    const columns = [
      {
        title: 'Username',
        dataIndex: 'username',
        key: 'username',
        width: '80%',
        render: text => <TruncateTableField text={text} />,
      },
      {
        title: 'Group Admin',
        dataIndex: 'admin',
        key: 'admin',
        width: '20%',
        render: value => <Checkbox checked={value} disabled />,
      },
    ];

    return (
      <Table
        dataSource={users}
        rowKey='id'
        columns={columns}
        style={{ marginTop: 15 }}
      />
    );
  }
}

export default GroupSettingsMembers;
