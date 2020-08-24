/** @jsx builder */
import builder, {Default, Condition, Layout} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import DatasetWrapper from '../src/cms-layouts/datasetWrapper';
import EnableUploadServer from '../src/cms-layouts/enableUploadServer';
import DatasetGroupWrapper from '../src/cms-layouts/datasetGroupsWrapper';
import {groupColumns, groupPickerColumns} from './utils';

export default () => (
  <array keyName="dataset" title="${dataset}"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../src/cms-components/customize-array-table_route"
    hideBackButton={true}
    uiParams={{
      columns: [{
        title: '${name}',
        dataIndex: 'name',
        sorter: true,
      }, {
        title: '${displayName}',
        dataIndex: 'displayName',
        sorter: true,
      }, {
        title: '${type}',
        dataIndex: 'type',
        sorter: true,
        render: (value) => {
          if (value == 'pv') {
            return 'persistent volume';
          } else if (value == 'hostPath') {
            return 'host path';
          } else {
            return value;
          }
        }
      }, {
        title: '${description}',
        dataIndex: 'description',
        sorter: true,
      }],
      disableCreate: true
    }}
    refetch
    hideButtons
    graphql={
      `
      query($datasetPage: Int, $datasetOrderBy: DatasetOrderByInput, $datasetWhere: DatasetWhereInput) {
        dataset: datasetsConnection(page: $datasetPage, orderBy: $datasetOrderBy, where: $datasetWhere) {
          edges {
            cursor
            node {
              id
              name
              displayName
              description
              type
              uploadServerLink
            }
          }
          pageInfo {
            currentPage
            totalPage
          }
        }
      }
      `
    }
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
    <Default component={DatasetWrapper}>
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
    <Condition match={(data, operator) => false} defaultMode="disabled">
      <string
        keyName="mountRoot"
        title="${mountRoot}"
        defaultValue={'/datasets'}
        packageName="../src/cms-components/customize-string-mount_root"
      />
    </Condition>
    <boolean keyName="global" title="${global}" />
    <Condition match={(data, operator) => !data.global} defaultMode="hidden">
      <boolean keyName="launchGroupOnly" title="${launchGroupOnly}" defaultValue={true} />
    </Condition>
    <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
    <string keyName="type" 
      required
      ui="select"
      title="${type}"
      packageName="../src/cms-components/customize-string-select"
      uiParams={{
        options: [{
          text: 'persistent volume',
          value: 'pv'
        }, {
          text: 'nfs',
          value: 'nfs'
        }, {
          text: 'host path',
          value: 'hostPath'
        },{
          text: 'git',
          value: 'git'
        }, {
          text: 'env',
          value: 'env'
        }],
        style: {width: 200},
      }}
    />
    </Condition>
    <Condition match={data => data.type === 'git'}>
      <string keyName="url" ui="link" title="${datasetUrl}"/>
      <relation
        title="${secret}"
        keyName="secret"
        uiParams={{
          textCol: 'displayName',
          columns: [{
            title: '${name}',
            dataIndex: 'name'
          }, {
            title: '${displayName}',
            dataIndex: 'displayName'
          }]
        }}
        relation={{
          to: 'secret',
          type: 'toOne'
        }}
      />
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
    <Condition match={data => data.type === 'nfs'}>
      <string keyName="nfsServer" title="${nfsServer}" 
        validation={{
          validator: (value, cb) => {
            if (!value.match(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)) {
              return cb(`please provide a domain or an ip.`);
            }
          }
        }}
        required
      />
      <string keyName="nfsPath" title="${nfsPath}" 
        validation={{
          validator: (value, cb) => {
            if (!value.match(/^\/|\/\/|(\/[\w-]+)+$/)) {
              return cb(`please provide a correct path string.`);
            }
          }
        }}
        required
      />
    </Condition>
    <Condition match={data => data.type === 'hostPath'}>
      <string keyName="hostPath" title="${hostPath}" 
        validation={{
          validator: (value, cb) => {
            if (!value.match(/^\/|\/\/|(\/[\w-]+)+$/)) {
              return cb(`please provide a correct path string.`);
            }
          }
        }}
        required
      />
    </Condition>
    <Condition match={data => data.type === 'pv'}>
      <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
        <string keyName="pvProvisioning" 
          required
          ui="select"
          title="${pvProvisioning}"
          packageName="../src/cms-components/customize-string-select"
          defaultValue={'auto'}
          uiParams={{
            options: [{
              text: 'auto',
              value: 'auto'
            }, {
              text: 'manual',
              value: 'manual'
            }],
            style: {width: 200},
          }}
        />
      </Condition>
      <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
        <Condition match={(data, operator) => operator === 'update'} defaultMode="hidden">
          <string keyName="volumeName" title="${volumeName}"/>
        </Condition>
        <Condition match={(data, operator) => (operator !== 'create' || data.pvProvisioning !== 'manual')}>
          <number keyName="volumeSize" title="${volumeSize}"
            uiParams={{unit: ' GB', step: 1, min: 1, precision: 0, 
              formatter: function(value) {return (value == -1 ? `-` : `${value} GB`)}
            }}
            defaultValue={1}
            packageName="../src/cms-components/customize-number-precision"
          />
        </Condition>
      </Condition>
    </Condition>
    <Condition match={data => ['pv', 'nfs', 'hostPath'].includes(data.type)}>
      <Layout component={EnableUploadServer}>
        <Condition match={(data, operator) => operator === 'update'} defaultMode="hidden">
          <boolean
            keyName="enableUploadServer"
            title="${dataset.enableUploadServer}"
            packageName="../src/cms-components/customize-boolean-enable_upload_server"
          />
        </Condition>
      </Layout>

      <string keyName="uploadServerLink" hidden />
    </Condition>
    <Condition match={data => !(data.global && !['pv', 'nfs', 'hostPath'].includes(data.type))}>
      <Layout component={DatasetGroupWrapper}>
        <relation keyName="groups"
          packageName='../src/cms-components/customize-relation-dataset_groups_table'
          relation={{
            to: 'group',
            type: 'toMany',
            fields: ['name', 'displayName', 'quotaCpu', 'quotaGpu', 'writable']
          }}
          uiParams={{
            columns: groupColumns,
            pickerColumns: groupPickerColumns,
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
                }
              }
              pageInfo {
                currentPage
                totalPage
              }
            }
          }
          `}
          fetchPolicy="no-cache"
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
            <pagination number/>
          </toolbar>
        </relation>
      </Layout>
    </Condition>
    </Default>
  </array>
)
