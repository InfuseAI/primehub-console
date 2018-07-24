/** @jsx builder */
import builder, {Default} from 'canner-script';
import RelationTable from '../src/cms-components/customize-relation-table';
export default () => (
  <array keyName="user" title="User" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'username',
        dataIndex: 'username'
      }],
      createKeys: ['createKeys']
    }}
  >
    <Default keyName="createKeys">
      <string keyName="username" title="Username" />
      <string keyName="email" title="Email" />
    </Default>
    <image keyName="thumbnail" title="Thumbnail" disabled />
    <string keyName="firstName" title="FirstName" />
    <string keyName="lastName" title="LastName" />
    <boolean keyName="totp" title="Totp" />
    <boolean keyName="isAdmin" title="IsAdmin" />
    <boolean keyName="enabled" title="Enabled" />
    <number keyName="createdTimestamp" title="CreatedTimestamp" />
    <string keyName="personalDiskQuota" title="PersonalDiskQuota" />
    <relation keyName="groups" title="Groups"
      packageName='../src/cms-components/customize-relation-table'
      relation={{
        to: 'group',
        type: 'toMany'
      }}
      uiParams={{
        textCol: 'displayName',
        columns: [{
          title: 'Display Name',
          dataIndex: 'displayName'
        }, {
          title: 'Can Use GPU',
          dataIndex: 'canUseGpu'
        }, {
          title: 'GPU Quota',
          dataIndex: 'gpuQuota'
        }, {
          title: 'Disk Quota',
          dataIndex: 'diskQuota'
        }]
      }}
    >
      <toolbar>
        {/* <filter
          fields={[{
            type: 'text',
            label: 'Display Name',
            key: 'displayName'
          }]}
        /> */}
        <pagination />
      </toolbar>
    </relation>
  </array>
)