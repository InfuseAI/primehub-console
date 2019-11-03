/** @jsx builder */
import builder, {Condition, Layout, Block, Row, Col} from 'canner-script';
import {Tag} from 'antd';
import {ImagePackages} from './utils.schema';

export default () => (
  <array keyName="buildImageJob"
    title="${buildImageJob}"
    cannerDataType="array"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    hideBackButton={true}
    hideButtons={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: '${buildImageJob.imageRevision}',
        dataIndex: 'imageRevision'
      }, {
        title: '${buildImageJob.udpatedAt}',
        dataIndex: 'updatedAt'
      }]
    }}
    graphql={
      `query($buildImageAfter: String, $buildImageBefore: String, $buildImageLast: Int, $buildImageFirst: Int,$buildImageWhere: buildImageWhereInput) {
        buildImage: buildImagesConnection(after: $buildImageAfter, before: $buildImageBefore, last: $buildImageLast, first: $buildImageFirst,where: $buildImageWhere) {
          edges {
            cursor
            node {
              id imageRevision updatedAt
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
    <Condition match={(data, operator) => false} defaultMode="disabled">
      <string keyName="imageRevision" title="${buildImageJob.imageRevision}" />
      <dateTime
        keyName="updatedAt"
        title="${buildImageJob.updatedAt}"
        packageName="../src/cms-components/customize-string-date.tsx"
        hidden
      />
      <string keyName="status" title="${buildImageJob.status}"/>
      <ImagePackages
        apt={{
          rows: 5,
          cols: 30,
          disabled: true,
          placeholderTemplate: 'buildImage.packages.apt.placeholder',
          minlength: 10,
          maxlength: 20
        }}
        pip={{
          rows: 5,
          cols: 30,
          disabled: true,
          placeholderTemplate: 'buildImage.packages.pip.placeholder',
          minlength: 10,
          maxlength: 20
        }}
        conda={{
          rows: 5,
          cols: 30,
          disabled: true,
          placeholderTemplate: 'buildImage.packages.conda.placeholder',
          minlength: 10,
          maxlength: 20
        }}
      />
      <string keyName="jobLogEndpoint" title="${buildImageJob.jobLogEndpoint}" ui="textarea"/> 
    </Condition>
  </array>
)
