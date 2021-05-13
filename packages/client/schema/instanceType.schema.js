/** @jsx builder */

import builder, {Condition, Tabs, Default, Layout} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {parseToStepDot5} from './utils';
import {Tag} from 'antd';
import {GroupRelation} from './utils.schema';
import TolerationLayout from '../src/cms-layouts/toleration';
import TextBlock from '../src/cms-layouts/text-block';
import DisableModeLayout from '../src/cms-layouts/disableMode';
import {GenTipsLabel} from '../src/cms-layouts/index';

export default () => (
  <array keyName="instanceType"
    title="${instanceTypes}"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: '${name}',
        dataIndex: 'name',
        sorter: true
      }, {
        title: '${displayName}',
        dataIndex: 'displayName',
        sorter: true
      }, {
        title: '${description}',
        dataIndex: 'description',
        sorter: true
      }, {
        title: '${cpuLimit}',
        dataIndex: 'cpuLimit',
        sorter: true,
        render: v => v || 0
      }, {
        title: '${gpuLimit}',
        dataIndex: 'gpuLimit',
        render: v => v || 0,
        sorter: true,
      }, {
        title: '${memoryLimit}',
        dataIndex: 'memoryLimit',
        render: text => `${text || 0} GB`,
        sorter: true,
      }],
      disableCreate: true
    }}
    graphql={`
      query($instanceTypePage: Int, $instanceTypeOrderBy: InstanceTypeOrderByInput, $instanceTypeWhere: InstanceTypeWhereInput) {
        instanceType: instanceTypesConnection(page: $instanceTypePage, orderBy: $instanceTypeOrderBy, where: $instanceTypeWhere) {
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
            currentPage
            totalPage
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
      <pagination number/>
    </toolbar>
    <Tabs>
      <Default title="Basic Info" keyName="basicInfo">
        <Layout component={DisableModeLayout}>
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
            <Layout component={GenTipsLabel('CPU Limit', 'Define how many CPU are allowed to use by this Instance Type. The value is also applied to CPU Request when CPU Request is disabled.', 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#creating-new-instance-types')}>
              <number keyName="cpuLimit"
                uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
                defaultValue={1}
                required
                packageName="../src/cms-components/customize-number-precision"
              />
          </Layout>
          <Layout component={GenTipsLabel('Memory Limit', 'Define how many memory are allowed to use by this Instance Type. The value also applied to Memory Request when Memory Request is disabled.', 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#creating-new-instance-types')}>
            <number keyName="memoryLimit"
              uiParams={{unit: ' GB', step: 1, min: 0.1, precision: 1}}
              defaultValue={1.0}
              required
              packageName="../src/cms-components/customize-number-precision"
            />
          </Layout>
          <Layout component={GenTipsLabel('GPU Limit', 'Define how many GPU can be used by this Instance Type. GPU can only be integer.', 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#creating-new-instance-types')}>
            <number keyName="gpuLimit" uiParams={{min: 0, precision: 0, step: 1}}
              packageName="../src/cms-components/customize-number-precision"
            />
          </Layout>
          <Default keyName="requestWithText"
            title="${instanceType.request.text.title}"
            description="${instanceType.request.text.description}"
            component={TextBlock}
          >
            <Layout component={GenTipsLabel('CPU Request', 'When enabled, instances are guaranteed to gain the amount of CPU they request. If CPU Request < CPU Limit, the system will try to overcommit CPU resources within the limit if more resources are available.', 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature')}>
              <number keyName="cpuRequest"
                uiParams={{step: 0.5, min: 0.5, precision: 1, parser: parseToStepDot5, disableText: ' '}}
                defaultValue={() => null}
                packageName="../src/cms-components/customize-number-checkbox"
                nullable
              />
            </Layout>
            <Layout component={GenTipsLabel('Memory Request', "When enabled, instances are guaranteed to get the amount of Memory they request. If Memory Request < Memory Limit, the system will try to overcommit Memory resources within the limit if more resources are available.", 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature')}>
              <number keyName="memoryRequest"
                uiParams={{unit: ' GB', step: 1, min: 1, precision: 1, disableText: ' '}}
                defaultValue={() => null}
                packageName="../src/cms-components/customize-number-checkbox"
                nullable
              />
            </Layout>
          </Default>
        </Layout>
        <Layout component={GenTipsLabel('Global', "When Global, everyone can access this Instance Type.", 'https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature')}>
          <boolean keyName="global" />
        </Layout>
        <Condition match={data => !data.global}>
          <GroupRelation />
        </Condition>
      </Default>
      <Default title="Tolerations" keyName="tolerations">
        <Tolerations />
      </Default>
      <Default title="Node Selector" keyName="nodeSelector">
        <Layout component={DisableModeLayout}>
          <NodeSelectors />
        </Layout>
      </Default>
    </Tabs>
  </array>
)

function NodeSelectors() {
  return (
    <json keyName="nodeSelector"
      packageName="../src/cms-components/customize-object-dynamic-field"
      customizeValidator={(data, cb) => {
        return Object.keys(data || {}).map((key, index) => {
          const value = data[key];
          if (key.length < 3) {
            return cb(index, `key should NOT be shorter than 3 characters`);
          }
          if (value.length < 3) {
            return cb(index, `value should NOT be shorter than 3 characters`);
          }
          if (key.length > 253) {
            return cb(index, `key should NOT be longer than 253 characters`);
          }
          if (value.length > 63) {
            return cb(index, `value should NOT be longer than 63 characters`);
          }
          if (key && !key.match(/^[A-Za-z0-9][_./-A-Za-z0-9]+[A-Za-z0-9]$/)) {
            return cb(index, `"${key}" must be alphanumeric characters, '_', '.', '/' or '-', and start and end with an alphanumeric character.`);
          }
          if (value && !value.match(/^[A-Za-z0-9][_.-A-Za-z0-9]+[A-Za-z0-9]$/)) {
            return cb(index, `"${value}" must be alphanumeric characters, '_', '.' or '-', and start and end with an alphanumeric character.`);
          }
          if (!key && !value) {
            return cb(index, `key and value can't be empty both.`);
          }
          return undefined
        }).filter(err => Boolean(err))[0];
      }}
    />
  );
}

function Tolerations() {
  return (
    <Layout component={DisableModeLayout}>
      <array keyName="tolerations"
        uiParams={{
          columns: [{
            title: 'Key',
            dataIndex: 'key'
          }, {
            title: 'Value',
            dataIndex: 'value'
          }, {
            title: 'Operator',
            dataIndex: 'operator'
          }, {
            title: 'Effect',
            dataIndex: 'effect'
          }]
        }}
      >
        <Layout component={DisableModeLayout}>
          <Layout component={TolerationLayout}>
            <string keyName="key" title="Key"/>
            <string keyName="value" title="Value"/>
            <string keyName="operator" title="Operator"
              ui="select"
              defaultValue="Exists"
              required
              uiParams={{
                options: [{
                  text: 'Equal',
                  value: 'Equal'
                }, {
                  text: 'Exists',
                  value: 'Exists'
                }]
              }}
            />
            <string keyName="effect" title="Effect"
              ui="select"
              defaultValue="None"
              uiParams={{
                options: [{
                  text: 'NoSchedule',
                  value: 'NoSchedule'
                }, {
                  text: 'PreferNoSchedule',
                  value: 'PreferNoSchedule'
                }, {
                  text: 'NoExecute',
                  value: 'NoExecute'
                }, {
                  text: 'None',
                  value: 'None'
                }]
              }}
            />
          </Layout>
        </Layout>
      </array>
    </Layout>
  );
}
