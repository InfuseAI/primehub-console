/** @jsx builder */
import builder, {Default, Condition} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {GroupRelation} from './utils.schema';

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
        title: '${type}',
        dataIndex: 'type'
      }, {
        title: '${description}',
        dataIndex: 'description'
      }]
    }}
    graphql={
      `
      query($datasetAfter: String, $datasetBefore: String, $datasetLast: Int, $datasetFirst: Int, $datasetWhere: DatasetWhereInput) {
        dataset: datasetsConnection(after: $datasetAfter, before: $datasetBefore, last: $datasetLast, first: $datasetFirst,where: $datasetWhere) {
          edges {
            cursor
            node {
              id
              name
              displayName
              description
              type
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
      `
    }
  >
    <toolbar async>
      <pagination />
    </toolbar>
    <Default>

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
        validation={{
          validator: (value, cb) => {
            return Object.keys(value).reduce((result, key) => {
              console.log(key);
              if (!key.match(/^[a-zA-Z_]+[a-zA-Z0-9_]*$/)) {
                return cb(`should be alphanumeric charcter, '_', and must start with a letter.`);
              }
              return result;
            }, '');
          }
        }}
        packageName="../src/cms-components/customize-object-dynamic-field"
      />
    </Condition>
    <Condition match={data => data.type === 'pv'}>
      <string keyName="volumeName" title="${volumeName}"/>
    </Condition>
    <Condition match={data => data.access === 'group'}>
      <GroupRelation />
    </Condition>
    </Default>
  </array>
)
