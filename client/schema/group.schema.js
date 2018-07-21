/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <array keyName="group" title="Group" ui="tableRoute">
    <string keyName="name" title="Name" />
    <string keyName="displayName" title="DisplayName" />
    <boolean keyName="canUseGpu" title="CanUseGpu" />
    <number keyName="gpuQuota" title="GpuQuota" />
    <number keyName="diskQuota" title="DiskQuota" />
    <relation keyName="users" title="Users"
      ui="multipleSelect"
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
    />
  </array>
)