/** @jsx builder */
import builder, {Default, Condition} from 'canner-script';
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
    <string  ui="select" keyName="access" title="${access}"
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
    <Condition match={data => data.type === 'git'}>
      <string keyName="url" ui="link" title="${url}"/>
    </Condition>
    <Condition match={data => data.type === 'env'}>
      <object keyName="variables"
        title="${variables}"
        packageName="../src/cms-components/customize-object-dynamic-field"
      />
    </Condition>
    <Condition match={data => data.type === 'pv'}>
      <string keyName="volumnName" title="${volumnName}"/>
    </Condition>
    <Condition match={data => data.access === 'group'}>
      <relation keyName="groups" title="${groups}"
        packageName='../src/cms-components/customize-relation-table'
        relation={{
          to: 'group',
          type: 'toMany'
        }}
        uiParams={{
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
    </Default>
  </array>
)