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
        dataIndex: 'name'
      }, {
        title: '${displayName}',
        dataIndex: 'displayName'
      }, {
        title: '${description}',
        dataIndex: 'description'
      }]
    }}
    graphql={
      `query($imageAfter: String, $imageBefore: String, $imageLast: Int, $imageFirst: Int,$imageWhere: ImageWhereInput) {
        image: imagesConnection(after: $imageAfter, before: $imageBefore, last: $imageLast, first: $imageFirst,where: $imageWhere) {
          edges {
            cursor
            node {
              id name displayName description
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
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
      <pagination />
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
            text: 'both',
            value: 'both'
          }]
        }}
        defaultValue="cpu"
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
