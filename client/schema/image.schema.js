/** @jsx builder */
import builder from 'canner-script';
import Filter from '../src/cms-toolbar/filter';

export default () => (
  <array keyName="image" title="${images}"
    cannerDataType="array"
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
      }]
    }}
  >
    <string keyName="name" title="${name}" />
    <string keyName="displayName" title="${displayName}" />
    <string keyName="description" title="${description}" />
    <string keyName="url" title="${url}" ui="link"/>
    <boolean keyName="global" title="${global}" />
    <relation keyName="groups" title="${groups}"
      packageName='../src/cms-components/customize-relation-table'
      relation={{
        to: 'group',
        type: 'toMany'
      }}
      hideTitle
      uiParams={{
        isHidden: record => record && record.global,
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
  </array>
)