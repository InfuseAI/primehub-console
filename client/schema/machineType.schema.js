/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <array keyName="machineType" title="MachineType" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'Name',
        dataIndex: 'name'
      }, {
        title: 'Cpu',
        dataIndex: 'cpu'
      }, {
        title: 'Gpu',
        dataIndex: 'gpu'
      }, {
        title: 'Memory',
        dataIndex: 'memory'
      }]
    }}
  >
    <string keyName="name" title="Name" />
    <string keyName="cpu" title="Cpu" />
    <string keyName="gpu" title="Gpu" />
    <number keyName="memory" title="Memory" />
    <boolean keyName="global" title="Global" />
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