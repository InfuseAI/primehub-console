/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <array keyName="instanceType" title="Instance Type" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'Name',
        dataIndex: 'name'
      }, {
        title: 'Description',
        dataIndex: 'description'
      }, {
        title: 'CPU Limit',
        dataIndex: 'cpuLimit'
      }, {
        title: 'GPU Limit',
        dataIndex: 'gpuLimit'
      }, {
        title: 'Memory Limit',
        dataIndex: 'memoryLimit'
      }]
    }}
  >
    <string keyName="name" title="Name" />
    <string keyName="description" title="Description" />
    <number keyName="cpuLimit" title="CPU Limit" uiParams={{min: 0}}/>
    <string keyName="memoryLimit" title="Memory Limit" />
    <number keyName="gpuLimit" title="GPU Limit" uiParams={{min: 0}}/>
    <number keyName="cpuRequest" title="CPU Request" uiParams={{min: 0}}/>
    <string keyName="memoryRequest" title="Memory Request" />
    <boolean keyName="global" title="Global" />
    <relation keyName="groups" title="Groups"
      packageName='../src/cms-components/customize-relation-table'
      relation={{
        to: 'group',
        type: 'toMany'
      }}
      hideTitle
      uiParams={{
        // hack
        isHidden: record => record.global,
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