/** @jsx builder */
import builder, {Condition, Block, Row, Col} from 'canner-script';
import {Tag} from 'antd';
import Filter from '../src/cms-toolbar/filter';
import {renderRelationField, parseToStepDot5} from './utils';
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
        title: '${cpuQuota}',
        dataIndex: 'quotaCpu',
        render: text => {
          return text === null ? React.createElement(Tag, {}, 'unlimited') : text;
        }
      }, {
        title: '${gpuQuota}',
        dataIndex: 'quotaGpu',
        render: text => {
          return text === null ? React.createElement(Tag, {}, 'unlimited') : text;
        }
      }, {
        title: '${users}',
        dataIndex: 'users',
        render: renderRelationField
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
    <string keyName="name" title="${name}"
      validation={{
        validator: (value, cb) => {
          if (!value.match(/^[A-Za-z0-9]([-A-Za-z0-9_]*[A-Za-z0-9])?(\.[A-Za-z0-9]([-A-Za-z0-9_]*[A-Za-z0-9])?)*$/)) {
            return cb(`alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character.`);
          }
        }
      }}
      required
    />

    <string keyName="displayName" title="${displayName}" />
    <Block title="User Quota">
      <Row type="flex">
        <Col sm={8} xs={24}>
          <number keyName="quotaCpu"
            uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
            defaultValue={0.5}
            title="${cpuQuota}"
            packageName="../src/cms-components/customize-number-checkbox.js"
            nullable
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="quotaGpu" title="${gpuQuota}"  uiParams={{min: 0, step: 1, precision: 0}}
            defaultValue={() => 0}
            packageName="../src/cms-components/customize-number-checkbox.js"
            nullable
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="quotaMemory" title="${quotaMemory}"  uiParams={{min: 0, step: 1, precision: 1, unit: ' GB'}}
            defaultValue={() => null}
            packageName="../src/cms-components/customize-number-checkbox.js"
            nullable
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="quotaDisk" title="${quotaDisk}"
            uiParams={{unit: ' GB', step: 1, min: 1, precision: 0}}
            defaultValue={() => 20}
            packageName="../src/cms-components/customize-number-precision"
            nullable
          />
        </Col>
      </Row>
    </Block>
    <Block title="${groupQuota}">
      <Row type="flex">
        <Col sm={8} xs={24}>
          <number keyName="projectQuotaCpu"
            uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
            title="${cpuQuota}"
            packageName="../src/cms-components/customize-number-checkbox.js"
            nullable
            defaultValue={() => null}
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="projectQuotaGpu" title="${gpuQuota}"  uiParams={{min: 0, step: 1, precision: 0}}
            packageName="../src/cms-components/customize-number-checkbox.js"
            nullable
            defaultValue={() => null}
          />
        </Col>
        <Col sm={8} xs={24}>
          <number keyName="projectQuotaMemory" title="${quotaMemory}"  uiParams={{min: 0, step: 1, precision: 1, unit: ' GB'}}
            packageName="../src/cms-components/customize-number-checkbox.js"
            nullable
            defaultValue={() => null}
          />
        </Col>
      </Row>
    </Block>
    <Block title="${users}">
      <relation keyName="users"
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
        <toolbar async>
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
    </Block>
  </array>
)
