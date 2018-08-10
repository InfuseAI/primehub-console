/** @jsx builder */
import builder, {Default} from 'canner-script';

export default () => (
  <array keyName="dataset" title="Dataset"
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
    <Default>
    <string keyName="name" title="Name" />
    <string keyName="displayName" title="Display Name" />
    <string keyName="description" title="Description" />
    <string keyName="access" title="Access" ui="select"
      uiParams={{
        options: [{
          text: 'group',
          value: 'group'
        }, {
          text: 'everyone',
          value: 'everyone'
        }, {
          text: 'admin',
          value: 'admin'
        }]
      }}
    />
    <string keyName="type" title="Type"
      ui="select"
      uiParams={{
        options: [{
          text: 'git',
          value: 'git'
        }, {
          text: 'env',
          value: 'env'
        }]
      }}
    />
    <string keyName="url" title="Url" packageName="../src/cms-components/customize-string-link"
      hideTitle
      uiParams={{
        isHidden: record => record.type !== 'git',
      }}
    />
    <object keyName="variables" title="variables" packageName="../src/cms-components/customize-object-dynamic-field"
      hideTitle
      uiParams={{
        isHidden: record => record.type !== 'env',
      }}
    />
    <relation keyName="groups" title="Groups"
      packageName='../src/cms-components/customize-relation-table'
      relation={{
        to: 'group',
        type: 'toMany'
      }}
      hideTitle
      uiParams={{
        isHidden: record => record.access !== 'group',
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
    </Default>
  </array>
)