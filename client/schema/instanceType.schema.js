/** @jsx builder */
import builder, {Condition} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {parseToStepDot5} from './utils';
import {Tag} from 'antd';
import {GroupRelation} from './utils.schema';

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
        dataIndex: 'cpuLimit',
        render: v => v || 0
      }, {
        title: '${gpuLimit}',
        dataIndex: 'gpuLimit',
        render: v => v || 0
      }, {
        title: '${memoryLimit}',
        dataIndex: 'memoryLimit',
        render: text => `${text || 0} GB`
      }]
    }}
    graphql={`
      query($instanceTypeAfter: String, $instanceTypeBefore: String, $instanceTypeLast: Int, $instanceTypeFirst: Int,$instanceTypeWhere: InstanceTypeWhereInput) {
        instanceType: instanceTypesConnection(after: $instanceTypeAfter, before: $instanceTypeBefore, last: $instanceTypeLast, first: $instanceTypeFirst,where: $instanceTypeWhere) {
          edges {
            cursor
            node {
              id
              name
              displayName
              description
              cpuLimit
              memoryLimit
              gpuLimit
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `}
  >
    <toolbar async>
      <filter
        component={Filter}
        fields={[{
          type: 'text',
          label: '${name}',
          key: 'name'
        }, {
          type: 'text',
          label: '${displayName}',
          key: 'displayName'
        }]}
      />
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
      required
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="memoryLimit" title="${memoryLimit}"
      uiParams={{unit: ' GB', step: 1, min: 0.1, precision: 1}}
      defaultValue={1.0}
      required
      packageName="../src/cms-components/customize-number-precision"
    />
    <number keyName="gpuLimit" title="${gpuLimit}" uiParams={{min: 0, precision: 0, step: 1}}
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="cpuRequest" title="${cpuRequest}"
      uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
      defaultValue={1}
      required
      packageName="../src/cms-components/customize-number-precision.js"
    />
    <number keyName="memoryRequest" title="${memoryRequest}"
      uiParams={{unit: ' GB', step: 1, min: 0.1, precision: 1}}
      defaultValue={1.0}
      required
      packageName="../src/cms-components/customize-number-precision"
    />
    <boolean keyName="global" title="${global}" />
    <Condition match={data => !data.global}>
      <GroupRelation />
    </Condition>
  </array>
)
