/** @jsx builder */
import builder, {Default} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';

export default () => (
  <array keyName="dataset" title="${dataset}"
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
    <Default>
    <string keyName="name" title="${name}" />
    <string keyName="displayName" title="${displayName}" />
    <string keyName="description" title="${description}" />
    <string keyName="access" title="${access}" ui="select"
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
    <string keyName="type" title="${type}"
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
    <string keyName="url" title="${url}" packageName="../src/cms-components/customize-string-link"
      hideTitle
      uiParams={{
        isHidden: record => !record || record.type !== 'git',
      }}
    />
    <object keyName="variables" title="${variables}" packageName="../src/cms-components/customize-object-dynamic-field"
      hideTitle
      uiParams={{
        isHidden: record => !record || record.type !== 'env',
      }}
    />
    <relation keyName="groups" title="${groups}"
      packageName='../src/cms-components/customize-relation-table'
      relation={{
        to: 'group',
        type: 'toMany'
      }}
      hideTitle
      uiParams={{
        isHidden: record => !record || record.access !== 'group',
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
    </Default>
  </array>
)