/** @jsx builder */
import builder, {Condition, Layout, Tabs, Default, Row, Col, Block} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';
import {Tag} from 'antd';
import {renderCopyableText, InvalidChError} from './utils';
import {CustomizedStringImagePullSecret, ImagePackages} from './utils.schema';
import BuildImageTab from '../src/cms-layouts/buildImageTab';

export default () => (
  <array keyName="buildImage"
    title="${buildImage}"
    cannerDataType="array"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: '${buildImage.name}',
        dataIndex: 'name'
      }, {
        title: '${buildImage.status}',
        dataIndex: 'status',
      }, {
        title: '${buildImage.image}',
        dataIndex: 'image',
        render: (text, record) => record.status === 'Succeeded' ? renderCopyableText(text,record) : '-'
      }],
      removeActions: true,
      buildImageCustomActions: true,
      disableCreate: true
    }}
    graphql={
      `query($buildImageAfter: String, $buildImageBefore: String, $buildImageLast: Int, $buildImageFirst: Int, $buildImageWhere: BuildImageWhereInput) {
        buildImage: buildImagesConnection(after: $buildImageAfter, before: $buildImageBefore, last: $buildImageLast, first: $buildImageFirst,where: $buildImageWhere) {
          edges {
            cursor
            node {
              id name image status
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }`
    }
    fetchPolicy="network-only"
    hideButtons
  >
    <Tabs component={BuildImageTab}>
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
        <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
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
        </Condition>
        <string
          required
          keyName="baseImage"
          title="${buildImage.baseImage}"
          uiParams={{style: {width: 300}}}
          packageName="../src/cms-components/customize-string-base_image"
        />
        <CustomizedStringImagePullSecret keyName="useImagePullSecret" title="${buildImage.useImagePullSecret}" />
        <ImagePackages
          apt={{
            rows: 5,
            cols: 30,
            placeholderTemplate: 'buildImage.packages.apt.placeholder',
            validator: (value, cb) => {
              if (value && value.match(/[;|#\"'`"]/)) {
                return cb(InvalidChError);
              }
            }
          }}
          pip={{
            rows: 5,
            cols: 30,
            placeholderTemplate: 'buildImage.packages.pip.placeholder',
            validator: (value, cb) => {
              if (value && value.match(/[;|#\"'`"]/)) {
                return cb(InvalidChError);
              }
            }
          }}
          conda={{
            rows: 5,
            cols: 30,
            placeholderTemplate: 'buildImage.packages.conda.placeholder',
            validator: (value, cb) => {
              if (value && value.match(/[;|#\"'`"]/)) {
                return cb(InvalidChError);
              }
            }
          }}
        />
      </Default>
      <Default keyName="jobs" title="${buildImage.tabs.jobs}">
        <array
          keyName="buildImageJobs"
          packageName="../src/cms-components/customize-array-nested_job"
          uiParams={{
            columns: [{
              title: '${buildImageJob.updateTime}',
              dataIndex: 'updateTime',
              render: text => {
                return text ? moment(text).format('YYYY/MM/DD HH:mm') : '-'
              }
            }, {
              title: '${buildImageJob.imageRevision}',
              dataIndex: 'imageRevision'
            }, {
              title: '${buildImageJob.status}',
              dataIndex: 'status'
            }, {
              title: '${buildImageJob.targetImage}',
              dataIndex: 'targetImage',
              render: (text, record) => record.status === 'Succeeded' ? renderCopyableText(text,record) : '-'
            }]
          }}
        >
          <toolbar async>
            <pagination />
          </toolbar>
          <string keyName="id" hidden/>
          <string keyName="imageRevision" title="${buildImageJob.imageRevision" />
          <string keyName="status" title="${buildImageJob.status" />
          <string keyName="targetImage" title="${buildImageJob.targetImage" />
          <dateTime
            keyName="updateTime"
            title="${buildImageJob.updateTime}" packageName="../src/cms-components/customize-string-date.tsx"
          />
        </array>
      </Default>
    </Tabs>
  </array>
)
