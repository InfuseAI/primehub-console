/** @jsx builder */
import builder, {Condition, Block, Row, Tabs, Col, Default, Layout} from 'canner-script';
import {Tag} from 'antd';
import Filter from '../src/cms-toolbar/filter';
import {renderRelationField, parseToStepDot5} from './utils';
import EnableModelDeployment from '../src/cms-layouts/enableModelDeployment';
import GroupEditTab from 'cms-layouts/groupEditTab';

export default () => (
  <array keyName="group" title="${group}"
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
        title: "${group.sharedVolumeCapacity}",
        dataIndex: 'sharedVolumeCapacity',
        sorter: true,
        visible: !modelDeploymentOnly,
        render: (value) => {
          if (value) {
            return `${value}G`
          }
          return '-'
        }
      }, {
        title: '${cpuQuotaListTitle}',
        dataIndex: 'quotaCpu',
        sorter: true,
        visible: !modelDeploymentOnly,
        render: text => {
          return text === null ? '∞' : text;
        },
      }, {
        title: '${gpuQuotaListTitle}',
        dataIndex: 'quotaGpu',
        sorter: true,
        visible: !modelDeploymentOnly,
        render: text => {
          return text === null ? '∞' : text;
        },
      }, {
        title: '${projectCpuQuota}',
        dataIndex: 'projectQuotaCpu',
        sorter: true,
        render: text => {
          return text === null ? '∞' : text;
        }
      }, {
        title: '${projectGpuQuota}',
        dataIndex: 'projectQuotaGpu',
        sorter: true,
        render: text => {
          return text === null ? '∞' : text;
        }
      },
      ],
      disableCreate: true
    }}
    graphql={`
      query($groupPage: Int, $groupOrderBy: GroupOrderByInput, $groupWhere: GroupWhereInput) {
        group: groupsConnection(page: $groupPage, orderBy: $groupOrderBy, where: $groupWhere) {
          edges {
            cursor
            node {
              id
              name
              displayName
              quotaCpu
              quotaGpu
              projectQuotaCpu
              projectQuotaGpu
              sharedVolumeCapacity
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
  <Tabs component={GroupEditTab}>
    <Default keyName="info" title="Info">
      <toolbar async>
        <filter
          component={Filter}
          fields={[{
            type: 'text',
            label: '${name}',
            placeholder: '{name}',
            key: 'name'
          }]}
        />
        <pagination number/>
      </toolbar>
      <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
        <string keyName="name" title="${name}"
          validation={{
            validator: (value, cb) => {
              if (!value.match(/^[A-Za-z0-9][-\w]*[A-Za-z0-9]+$/)) {
                return cb("Group name must begin and end with an alphanumeric character.");
              }
            }
          }}
          required
        />
      </Condition>

      <string keyName="displayName" title="${displayName}" />
      <Condition match={() => !modelDeploymentOnly} defaultMode="hidden">
       {/* Hidden enable EnableModelDeployment
         * because in "deploy" mode it is always enabled. */}
        <Layout component={EnableModelDeployment}>
          <boolean keyName="enabledDeployment" title="${groups.enabledDeployment}" uiParams={{yesText: ' ', noText: ' '}} />
        </Layout>
      </Condition>
      <Condition match={() => !modelDeploymentOnly} defaultMode="hidden">
        <ShareVolumn />
        <number keyName="jobDefaultActiveDeadlineSeconds" 
          title="${group.jobDefaultActiveDeadlineSeconds}"
          packageName="../src/cms-components/customize-number-with_select_multiplier"
          defaultValue={() => null}
          nullable
          uiParams={{
            options: [{
              text: 'Minutes',
              value: 'm',
              multiplier: 60
            }, {
              text: 'Hours',
              value: 'h',
              multiplier: 60*60
            }, {
              text: 'Days',
              value: 'd',
              multiplier: 60*60*24
            }],
            styleOnSelect: {width: 200},
            defaultSelected: 1,
            styleOnInput: {width: 100, marginRight: 10},
            min: 0,
            max: 999,
            step: 1
          }}
        />
      </Condition>
      <Condition match={() => !modelDeploymentOnly} defaultMode="hidden">
        <Block title="User Quota">
          <Row type="flex">
            <Col sm={8} xs={24}>
              <number keyName="quotaCpu"
                uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
                defaultValue={0.5}
                title="${cpuQuota}"
                packageName="../src/cms-components/customize-number-checkbox"
                nullable
              />
            </Col>
            <Col sm={8} xs={24}>
              <number keyName="quotaGpu" title="${gpuQuota}"  uiParams={{min: 0, step: 1, precision: 0}}
                defaultValue={() => 0}
                packageName="../src/cms-components/customize-number-checkbox"
                nullable
              />
            </Col>
            <Col sm={8} xs={24}>
              <number keyName="quotaMemory" title="${quotaMemory}"  uiParams={{min: 0, step: 1, precision: 1, unit: ' GB'}}
                defaultValue={() => null}
                packageName="../src/cms-components/customize-number-checkbox"
                nullable
              />
            </Col>
          </Row>
        </Block>
      </Condition>
      <Block title="${groupQuota}">
        <Row type="flex">
          <Col sm={8} xs={24}>
            <number keyName="projectQuotaCpu"
              uiParams={{min: 0.5, step: 0.5, precision: 1, parser: parseToStepDot5}}
              title="${cpuQuota}"
              packageName="../src/cms-components/customize-number-checkbox"
              nullable
              defaultValue={() => null}
            />
          </Col>
          <Col sm={8} xs={24}>
            <number keyName="projectQuotaGpu" title="${gpuQuota}"  uiParams={{min: 0, step: 1, precision: 0}}
              packageName="../src/cms-components/customize-number-checkbox"
              nullable
              defaultValue={() => null}
            />
          </Col>
          <Col sm={8} xs={24}>
            <number keyName="projectQuotaMemory" title="${quotaMemory}"  uiParams={{min: 0, step: 1, precision: 1, unit: ' GB'}}
              packageName="../src/cms-components/customize-number-checkbox"
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
            <pagination/>
          </toolbar>
        </relation>
      </Block>
    </Default>
    <Default keyName="dataset"  match={() => !modelDeploymentOnly} title="Dataset">
      <Block title="${dataset}">
        <array keyName="datasets"
          packageName="../src/cms-components/customize-array-datasets_in_groups"
          uiParams={{
            removeActions: true,
            columns: [{
              title: '${displayName}',
              dataIndex: 'displayName'
            }, {
              title: '${type}',
              dataIndex: 'type'
            }, {
              title: '${description}',
              dataIndex: 'description'
            }, {
              title: '${groups.datasets.writable}',
              dataIndex: 'writable',
              render: writable => writable ? 'Write' : 'Read Only'
            }]
          }}
        >
          <string keyName="id" />
          <string keyName="displayName" title="${displayName}" />
          <string keyName="type"
            ui="select"
            title="${type}"
            uiParams={{
              options: [{
                text: 'git',
                value: 'git'
              }, {
                text: 'env',
                value: 'env'
              }, {
                text: 'pv',
                value: 'pv'
              }]
            }}
          />
          <string keyName="description" title="${description}" />
    {/* writable is only used to check in dataset.groups table, no need to show */}
          <boolean keyName="writable" title="${groups.datasets.writable}" />
        </array>
      </Block>
      <boolean keyName="writable" hidden />
    </Default>
    { /* Images tabular */}
    <Default keyName="images" match={() => !modelDeploymentOnly}  title="Images">
      <Block title="${images}">
        <array keyName="images"
          packageName="../src/cms-components/customize-array-images_in_groups"
          uiParams={{
            removeActions: true,
            columns: [{
              title: '${displayName}',
              dataIndex: 'displayName'
            }, {
              title: '${type}',
              dataIndex: 'type',
              render: (value) => {
                if (!value) {
                    return '-';
                }
                if (value === 'both') {
                    return 'universal';
                }
                return value;
              }
            }, {
              title: '${description}',
              dataIndex: 'description'
            }]
          }}
        >
          <string keyName="id" />
          <string keyName="displayName" title="${displayName}" />
          <string keyName="type" title="${type} "/>
          <string keyName="description" title="${description}" />
        </array>
      </Block>
    </Default>
    { /* Instance Type tabular */}
    <Default keyName="instanceTypes" title="Instance Type">
      <Block title="${instanceTypes}">
        <array keyName="instanceTypes"
          packageName="../src/cms-components/customize-array-instance_in_groups"
          uiParams={{
            removeActions: true,
            columns: [{
              title: '${displayName}',
              dataIndex: 'displayName'
            }, {
              title: '${description}',
              dataIndex: 'description'
            }, {
              title: '${cpuLimit}',
              dataIndex: 'cpuLimit'
            }, {
              title: '${memoryLimit}',
              dataIndex: 'memoryLimit'
            }, {
              title: '${gpuLimit}',
              dataIndex: 'gpuLimit'
            }]
          }}
        >
          <string keyName="id" />
          <string keyName="displayName" title="${displayName}" />
          <string keyName="description" title="${description}" />
          <string keyName="cpuLimit" title="${cpuLimit}" />
          <string keyName="memoryLimit" title="${memoryLimit}" />
          <string keyName="gpuLimit" title="${gpuLimit}" />
        </array>
      </Block>
    </Default>
  </Tabs>
  </array>
)


function ShareVolumn() {
  return (
    <Default>
      <boolean keyName="enabledSharedVolume" title="${group.enabledSharedVolume}" 
        packageName="../src/cms-components/customize-boolean-enable_shared_volume"
      />
      <Condition match={data => data.enabledSharedVolume} defaultMode="hidden">
        <Block title="Shared Volume">
          <Row type="flex">
            <Col sm={8} xs={24}>
              <number keyName="sharedVolumeCapacity"
                title="${group.sharedVolumeCapacity}"
                uiParams={{min: 1, step: 1, precision: 0, unit: ' GB'}}
                packageName="../src/cms-components/customize-number-shared_volume_capacity"
                // description="This volume size will not resize on update. It only work for newly created volume."
              />
            </Col>
            <Col sm={8} xs={24}>
              <boolean keyName="launchGroupOnly" title="${group.launchGroupOnly}" defaultValue={() => true} />
            </Col>
          </Row>
        </Block>
      </Condition>
    </Default>
  )
}
