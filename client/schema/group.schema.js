/** @jsx builder */
import builder from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {renderRelationField} from './utils';
export default () => (
  <array keyName="group" title="Group"
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
      <filter
        component={Filter}
        fields={[{
          type: 'text',
          label: 'Name',
          key: 'name'
        }, {
          type: 'text',
          label: 'Display Name',
          key: 'displayName'
        }]}
      />
      <pagination />
    </toolbar>
    <string keyName="name" title="Name"
      validation={{pattern: '^[a-z0-9_]+$'}}
      required
    />
    <string keyName="displayName" title="DisplayName" />
    <boolean keyName="canUseGpu" title="CanUseGpu" />
    <number keyName="cpuQuota" uiParams={{min: 0, precision: 1}}
      title="CpuQuota"
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="gpuQuota" title="GpuQuota"  uiParams={{min: 0, step: 1, precision: 0}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="diskQuota" title="DiskQuota"
      uiParams={{unit: ' GB', step: 1, min: 0, precision: 1}}
      packageName="../src/cms-components/customize-number-precision"
    />
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
        <filter
          fields={[{
            type: 'text',
            label: 'Username',
            key: 'username'
          }]}
        />
        <pagination />
      </toolbar>
    </relation>
  </array>
)