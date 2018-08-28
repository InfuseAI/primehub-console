/** @jsx builder */
import builder, {Condition} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {renderRelationField} from './utils';
export default () => (
  <array keyName="group" title="${group}"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: '${name}',
        dataIndex: 'name'
      }, {
        title: '${displayName}',
        dataIndex: 'displayName'
      }, {
        title: '${canUseGpu}',
        dataIndex: 'canUseGpu'
      }, {
        title: '${cpuQuota}',
        dataIndex: 'cpuQuota'
      }, {
        title: '${gpuQuota}',
        dataIndex: 'gpuQuota'
      }, {
        title: '${users}',
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
          label: '${name}',
          key: 'name'
        }]}
      />
      <pagination />
    </toolbar>
    <string keyName="name" title="${name}"
      validation={{
        validator: (value, cb) => {
          if (!value.match(/^[a-z0-9_]+$/)) {
            return cb('only lowercase letters, numbers, and underscores ("_") are allowed');
          }
        }
      }}
      required
    />

    <string keyName="displayName" title="${displayName}" />
    <boolean keyName="canUseGpu" title="${canUseGpu}" />
    <number keyName="cpuQuota" uiParams={{min: 0, precision: 1}}
      title="${cpuQuota}"
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="gpuQuota" title="${gpuQuota}"  uiParams={{min: 0, step: 1, precision: 0}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="diskQuota" title="${diskQuota}"
      uiParams={{unit: ' GB', step: 1, min: 1, precision: 0}}
      packageName="../src/cms-components/customize-number-precision"
    />
    <relation keyName="users" title="${users}"
      packageName='../src/cms-components/customize-relation-table'
      relation={{
        to: 'user',
        type: 'toMany'
      }}
      uiParams={{
        textCol: 'username',
        columns: [{
          title: '${username}',
          dataIndex: 'username'
        }]
      }}
    >
      <toolbar>
        <filter
          component={Filter}
          fields={[{
            type: 'text',
            label: '${username}',
            key: 'username'
          }]}
        />
        <pagination />
      </toolbar>
    </relation>
  </array>
)
