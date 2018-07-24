/** @jsx builder */
import builder from 'canner-script';
import {renderRelationField} from './utils';
export default () => (
  <array keyName="group" title="Group" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'Display Name',
        dataIndex: 'displayName'
      }, {
        title: 'Can Use Gpu',
        dataIndex: 'canUseGpu'
      }, {
        title: 'Cpu Quota',
        dataIndex: 'cpuQuota'
      }, {
        title: 'Gpu Quota',
        dataIndex: 'gpuQuota'
      }, {
        title: 'Users',
        dataIndex: 'users',
        render: renderRelationField
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
    <string keyName="name" title="Name" />
    <string keyName="displayName" title="DisplayName" />
    <boolean keyName="canUseGpu" title="CanUseGpu" />
    <number keyName="gpuQuota" title="GpuQuota" />
    <number keyName="diskQuota" title="DiskQuota" />
    <relation keyName="users" title="Users"
      packageName='../src/cms-components/customize-relation-table'
      relation={{
        to: 'user',
        type: 'toMany'
      }}
      uiParams={{
        textCol: 'username',
        columns: [{
          title: 'Username',
          dataIndex: 'username'
        }]
      }}
    >
      <toolbar>
        {/* <filter
          fields={[{
            type: 'text',
            label: 'Username',
            key: 'username'
          }]}
        /> */}
        <pagination />
      </toolbar>
    </relation>
  </array>
)