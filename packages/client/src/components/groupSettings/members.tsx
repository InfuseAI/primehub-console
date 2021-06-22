import React from 'react';
import { get  } from 'lodash';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { Checkbox, Table } from 'antd';
import { GetGroupUsers } from 'queries/Group.graphql';

interface Props {
  group: any;
  groupUsers: any;
}

class GroupSettingsMembers extends React.Component<Props> {

  render() {
    const { group, groupUsers } = this.props;

    if (!group || groupUsers.loading) {
      return (<div>loading...</div>);
    }

    const admins = get(groupUsers, 'group.admins', []).split(',');
    const users = get(groupUsers, 'group.users', []).map(user => {
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

export default compose(
  graphql(GetGroupUsers, {
    options: (props: Props) => {
      const { group } = props;
      const where = {} as any;
      if (group) {
        where.id = group.id;
      }

      return {
        variables: {
          where,
        },
      };
    },
    name: 'groupUsers',
  }),
)(GroupSettingsMembers);
