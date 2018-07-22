/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <array keyName="user" title="User" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'username',
        dataIndex: 'username'
      }]
    }}
  >
    <string keyName="username" title="Username" />
    <string keyName="email" title="Email" />
    <string keyName="thumbnail" title="Thumbnail" />
    <string keyName="firstName" title="FirstName" />
    <string keyName="lastName" title="LastName" />
    <boolean keyName="totp" title="Totp" />
    <boolean keyName="isAdmin" title="IsAdmin" />
    <boolean keyName="enabled" title="Enabled" />
    <number keyName="createdTimestamp" title="CreatedTimestamp" />
    <number keyName="personalDiskQuota" title="PersonalDiskQuota" />
    <relation keyName="groups" title="Groups"
      ui="multipleSelect"
      relation={{
        to: 'group',
        type: 'toMany'
      }}
      uiParams={{
        textCol: 'displayName',
        columns: [{
          title: 'Display Name',
          dataIndex: 'displayName'
        }]
      }}
    />
  </array>
)