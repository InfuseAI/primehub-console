/** @jsx builder */
import builder, {Condition, Layout} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {Tag} from 'antd';
import {GroupRelation, CustomizedStringImagePullSecret, CustomizedStringSelectWithCheckbox} from './utils.schema';
import DisableModeLayout from '../src/cms-layouts/disableMode';

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
          if (!value) {
              return '-';
          }

          if (value === 'both') {
              return 'universal';
          }

          return value;
        }
      },{
        title: '${description}',
        dataIndex: 'description',
        sorter: true,
      }],
      disableCreate: true
    }}
    graphql={
      `query($imagePage: Int, $imageOrderBy: ImageOrderByInput, $imageWhere: ImageWhereInput) {
        image: imagesConnection(page: $imagePage, orderBy: $imageOrderBy, where: $imageWhere) {
          edges {
            cursor
            node {
              id name displayName description type
            }
          }
          pageInfo {
            currentPage
            totalPage
          }
        }
      }`
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
      <pagination number />
    </toolbar>
    <Layout component={DisableModeLayout}>
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
      <string keyName="type" 
        ui="select"
        title="${type}"
        uiParams={{
          options: [{
            text: 'cpu',
            value: 'cpu'
          }, {
            text: 'gpu',
            value: 'gpu'
          }, {
            text: 'universal',
            value: 'both'
          }]
        }}
        defaultValue="both"
      />
      <string keyName="url" title="${imageUrl}"/>
      <Condition match={data => data.type === 'both'}>
        <CustomizedStringSelectWithCheckbox keyName="urlForGpu" title="${images.urlForGpu}" defaultValue={() => null} />
      </Condition>
      <CustomizedStringImagePullSecret keyName="useImagePullSecret" title="${images.useImagePullSecret}" />
    </Layout>
    <boolean keyName="global" title="${global}" />
    <Condition match={data => !data.global}>
      <GroupRelation />
    </Condition>
  </array>
)
