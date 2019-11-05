/** @jsx builder */
import builder, {Condition, Layout, Tabs, Default, Row, Col, Block} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {Tag} from 'antd';
import {renderCopyableText} from './utils';
import {CustomizedStringImagePullSecret, ImagePackages} from './utils.schema';

export default () => (
  <array keyName="buildImage"
    title="${buildImage}"
    cannerDataType="array"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: '${buildImage.status}',
        dataIndex: 'status',
      }, {
        title: '${buildImage.name}',
        dataIndex: 'name',
        render: renderCopyableText
      }]
    }}
    graphql={
      `query($buildImageAfter: String, $buildImageBefore: String, $buildImageLast: Int, $buildImageFirst: Int, $buildImageWhere: BuildImageWhereInput) {
        buildImage: buildImagesConnection(after: $buildImageAfter, before: $buildImageBefore, last: $buildImageLast, first: $buildImageFirst,where: $buildImageWhere) {
          edges {
            cursor
            node {
              id name status
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
    <Tabs>
      <Default keyName="info" title="${buildImage.tabs.info}">
        <toolbar async>
          <filter
            component={Filter}
            fields={[{
              type: 'text',
              label: '${buildImage.name}',
              key: 'name'
            }]}
          />
          <pagination />
        </toolbar>
        <string keyName="status" title="${buildImage.status}" hidden/>
        <string keyName="name" title="${buildImage.name}"
          validation={{
            validator: (value, cb) => {
              if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/)) {
                return cb(`lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`);
              }
            }
          }}
          required
        />
        <string keyName="baseImage" title="${buildImage.baseImage}"/>
        <CustomizedStringImagePullSecret keyName="useImagePullSecret" title="${buildImage.useImagePullSecret}" />
        <ImagePackages
          apt={{
            rows: 5,
            cols: 30,
            placeholderTemplate: 'buildImage.packages.apt.placeholder',
            minlength: 10,
            maxlength: 20
          }}
          pip={{
            rows: 5,
            cols: 30,
            placeholderTemplate: 'buildImage.packages.pip.placeholder',
            minlength: 10,
            maxlength: 20
          }}
          conda={{
            rows: 5,
            cols: 30,
            placeholderTemplate: 'buildImage.packages.conda.placeholder',
            minlength: 10,
            maxlength: 20
          }}
        />
      </Default>
      <Default keyName="jobs" title="${buildImage.tabs.jobs}">
        <array
          keyName="buildImageJobs"
          packageName="../src/cms-components/customize-array-nested_job"
          uiParams={{
            columns: [{
              title: '${buildImageJob.imageRevision}',
              dataIndex: 'imageRevision',
              render: renderCopyableText
            }, {
              title: '${buildImageJob.updateTime}',
              dataIndex: 'updateTime'
            }]
          }}
        >
          <toolbar async>
            <pagination />
          </toolbar>
          <string keyName="id" hidden/>
          <string keyName="imageRevision" title="${buildImageJob.imageRevision" />
          <dateTime
            keyName="updateTime"
            title="${buildImageJob.updateTime}" packageName="../src/cms-components/customize-string-date.tsx"
          />
        </array>
      </Default>
    </Tabs>
  </array>
)
