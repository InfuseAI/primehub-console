/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <array keyName="image" title="Image"
    cannerDataType="array"
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
      }]
    }}
  >
    <toolbar>
      <filter
        fields={[{
          type: 'text',
          label: 'Name',
          key: 'name'
        }]}
      />
      <pagination />
    </toolbar>
    <string keyName="name" title="Name" />
    <string keyName="displayName" title="Display Name" />
    <string keyName="description" title="Description" />
    <string keyName="url" title="Url" ui="link"/>
    <boolean keyName="global" title="Global" />
    <relation keyName="groups" title="Groups"
      packageName='../src/cms-components/customize-relation-table'
      relation={{
        to: 'group',
        type: 'toMany'
      }}
      hideTitle
      uiParams={{
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