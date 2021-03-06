/** @jsx builder */
import builder, {Condition, Layout, Tabs, Default, Row, Col, Block} from 'canner-script';
import moment from 'moment';
import Filter from '../../src/cms-toolbar/filter';
import {Tag} from 'antd';
import {renderCopyableText, InvalidChError} from 'schema/utils';
import {CustomizedStringImagePullSecret, ImagePackages} from 'schema/utils.schema';
import BuildImageTab from '../../src/cms-layouts/buildImageTab';

export default () => (
  <array keyName="buildImage"
    title="${buildImage}"
    cannerDataType="array"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: '${buildImage.name}',
        dataIndex: 'name',
        sorter: true,
      }, {
        title: '${buildImage.status}',
        dataIndex: 'status',
        sorter: true,
      }, {
        title: '${buildImage.image}',
        dataIndex: 'image',
        sorter: true,
        render: (text, record) => record.status === 'Succeeded' ? renderCopyableText(text,record) : '-'
      }],
      removeActions: true,
      buildImageCustomActions: true,
      disableCreate: true
    }}
    graphql={
      `query($buildImagePage: Int, $buildImageOrderBy: BuildImageOrderByInput, $buildImageWhere: BuildImageWhereInput) {
        buildImage: buildImagesConnection(page: $buildImagePage, orderBy: $buildImageOrderBy, where: $buildImageWhere) {
          edges {
            cursor
            node {
              id name image status
            }
          }
          pageInfo {
            totalPage
            currentPage
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
          <pagination number />
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
          uiParams={{style: {width: '60%'}}}
          packageName="../../src/cms-components/customize-string-base_image"
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
          packageName="../../src/cms-components/customize-array-nested_job"
          uiParams={{
            columns: [{
              title: '${buildImageJob.updateTime}',
              dataIndex: 'updateTime',
              sorter: (a, b) => {
                const value = new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime();
                return value
              },
              render: text => {
                return text ? moment(text).format('YYYY/MM/DD HH:mm') : '-'
              }
            }, {
              title: '${buildImageJob.imageRevision}',
              sorter: (a, b) => (a.imageRevision || '').localeCompare(b.imageRevision || ''),
              dataIndex: 'imageRevision'
            }, {
              title: '${buildImageJob.status}',
              sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
              dataIndex: 'status'
            }, {
              title: '${buildImageJob.targetImage}',
              sorter: (a, b) => (a.targetImage || '').localeCompare(b.targetImage || ''),
              dataIndex: 'targetImage',
              render: (text, record) => record.status === 'Succeeded' ? renderCopyableText(text,record) : '-'
            }]
          }}
        >
          <string keyName="id" hidden/>
          <string keyName="imageRevision" title="${buildImageJob.imageRevision" />
          <string keyName="status" title="${buildImageJob.status" />
          <string keyName="targetImage" title="${buildImageJob.targetImage" />
          <dateTime
            keyName="updateTime"
            title="${buildImageJob.updateTime}" packageName="../../src/cms-components/customize-string-date.tsx"
          />
        </array>
      </Default>
    </Tabs>
  </array>
)
