/** @jsx builder */
import builder from 'canner-script';
import Filter from '../src/cms-toolbar/filter';

export default () => (
  <array keyName="instanceType" title="Instance Types"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: 'Name',
        dataIndex: 'name'
      }, {
        title: 'Display Name',
        dataIndex: 'displayName'
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
        dataIndex: 'memoryLimit',
        render: text => `${text} MB`
      }]
    }}
  >
    <string keyName="name" title="Name" />
    <string keyName="displayName" title="Display Name" />
    <string keyName="description" title="Description" />
    <number keyName="cpuLimit" title="CPU Limit" uiParams={{min: 0, step: 1, precision: 1}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="memoryLimit" title="Memory Limit"
      uiParams={{unit: ' MB', step: 1, min: 0, precision: 1}}
      packageName="../src/cms-components/customize-number-precision"
    />
    <number keyName="gpuLimit" title="GPU Limit" uiParams={{min: 0, precision: 0, step: 1}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="cpuRequest" title="CPU Request" uiParams={{min: 0, step: 1, precision: 1}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="memoryRequest" title="Memory Request"
      uiParams={{unit: ' MB', step: 1, min: 0, precision: 1}}
      packageName="../src/cms-components/customize-number-precision"
    />
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
        <filter
          component={Filter}
          fields={[{
            type: 'text',
            label: 'Display Name',
            key: 'displayName'
          }]}
        />
        <pagination />
      </toolbar>
    </relation>
  </array>
)