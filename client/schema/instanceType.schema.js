/** @jsx builder */
import builder, {Condition} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {parseToStepDot5} from './utils';
import {Tag} from 'antd';

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
    <toolbar async>
      <pagination />
    </toolbar>
    <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
      <string keyName="name" title="${name}"
        validation={{
          validator: (value, cb) => {
            if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/)) {
              return cb(`lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`);
            }
          }
        }}
        required
      />
    </Condition>
    <string keyName="displayName" title="${displayName}" />
    <string keyName="description" title="${description}" />
    <number keyName="cpuLimit" title="${cpuLimit}"
      uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
      defaultValue={1}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="memoryLimit" title="${memoryLimit}"
      uiParams={{unit: ' GB', step: 1, min: 0, precision: 1}}
      packageName="../src/cms-components/customize-number-precision"
    />
    <number keyName="gpuLimit" title="${gpuLimit}" uiParams={{min: 0, precision: 0, step: 1}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="cpuRequest" title="${cpuRequest}"
      uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
      defaultValue={1}
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
        uiParams={{
          // hack
          textCol: 'displayName',
          columns: [{
            title: '${name}',
            dataIndex: 'name'
          }, {
            title: '${displayName}',
            dataIndex: 'displayName'
          }, , {
            title: '${cpuQuota}',
            dataIndex: 'quotaCpu',
            render: text => {
              return text === null ? '∞' : text;
            }
          }, {
            title: '${gpuQuota}',
            dataIndex: 'quotaGpu',
            render: text => {
              return text === null ? '∞' : text;
            }
          }, {
            title: '${quotaDisk}',
            dataIndex: 'quotaDisk',
            render: text => {
              return text === null ? '∞' : text;
            }
          }]
        }}
      >
        <toolbar async>
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
      </relation>
    </Condition>
  </array>
)
