/** @jsx builder */
import builder, {Condition} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';

export default () => (
  <array keyName="image"
    title="${images}"
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
    <string keyName="url" ui="link" title="${url}"/>
    <boolean keyName="global" title="${global}" />
    <Condition match={data => !data.global}>
      <relation keyName="groups" title="${groups}"
        packageName='../src/cms-components/customize-relation-table'
        relation={{
          to: 'group',
          type: 'toMany'
        }}
        hideTitle
        uiParams={{
          columns: [{
            title: '${name}',
            dataIndex: 'name'
          }, {
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
