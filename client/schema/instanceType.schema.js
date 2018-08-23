/** @jsx builder */
import builder, {Condition} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';

export default () => (
  <array keyName="instanceType"
    title="${instanceTypes}"
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
        title: '${description}',
        dataIndex: 'description'
      }, {
        title: '${cpuLimit}',
        dataIndex: 'cpuLimit'
      }, {
        title: '${gpuLimit}',
        dataIndex: 'gpuLimit'
      }, {
        title: '${memoryLimit}',
        dataIndex: 'memoryLimit',
        render: text => `${text} GB`
      }]
    }}
  >

    <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
      <string keyName="name" title="${name}"
        validation={{
          validator: (value, cb) => {
            console.log(value);
            if (!value.match(/^[a-z0-9_-]+$/)) {
              return cb('only alphabet, number, dash (-) and underscore (_) are allowed');
            }
          }
        }}
        required
      />
    </Condition>
    <string keyName="displayName" title="${displayName}" />
    <string keyName="description" title="${description}" />
    <number keyName="cpuLimit" title="${cpuLimit}" uiParams={{min: 0, step: 1, precision: 1}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="memoryLimit" title="${memoryLimit}"
      uiParams={{unit: ' GB', step: 1, min: 0, precision: 1}}
      packageName="../src/cms-components/customize-number-precision"
    />
    <number keyName="gpuLimit" title="${gpuLimit}" uiParams={{min: 0, precision: 0, step: 1}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="cpuRequest" title="${cpuRequest}" uiParams={{min: 0, step: 1, precision: 1}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="memoryRequest" title="${memoryRequest}"
      uiParams={{unit: ' GB', step: 1, min: 0, precision: 1}}
      packageName="../src/cms-components/customize-number-precision"
    />
    <boolean keyName="global" title="${global}" />
    <Condition match={data => !data.global}>
      <relation keyName="groups" title="${groups}"
        packageName='../src/cms-components/customize-relation-table'
        relation={{
          to: 'group',
          type: 'toMany'
        }}
        hideTitle
        uiParams={{
          // hack
          textCol: 'displayName',
          columns: [{
            title: '${displayName}',
            dataIndex: 'displayName'
          }, {
            title: '${canUseGpu}',
            dataIndex: 'canUseGpu'
          }, {
            title: '${gpuQuota}',
            dataIndex: 'gpuQuota'
          }, {
            title: '${diskQuota}',
            dataIndex: 'diskQuota'
          }]
        }}
      >
        <toolbar>
          <filter
            component={Filter}
            fields={[{
              type: 'text',
              label: '${displayName}',
              key: 'displayName'
            }]}
          />
          <pagination />
        </toolbar>
      </relation>
    </Condition>
  </array>
)
