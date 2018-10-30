/** @jsx builder */
import builder, {Condition, Block, Row, Col} from 'canner-script';
import {Tag} from 'antd';
import Filter from '../src/cms-toolbar/filter';
import {renderContent, renderStatus, renderActions} from './utils';
import {GroupRelation} from './utils.schema';

export default () => (
  <array keyName="announcement" title="${announcement}"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    hideButtons={true}
    packageName="../src/cms-components/customize-array-table_route.js"
    uiParams={{
      announcementCustomActions: true,
      removeActions: true,
      columns: [{
        title: '${anno.content}',
        dataIndex: 'content',
        // render: renderContent
      }, {
        title: '${anno.expiryDate}',
        dataIndex: 'expiryDate'
      }, {
        title: '${anno.global}',
        dataIndex: 'global'
      }, {
        title: '${anno.sendEmail}',
        dataIndex: 'sendEmail'
      }, {
        title: '${anno.status}',
        dataIndex: 'status',
        render: renderStatus
      }]
    }}
  >
     <toolbar async>
      <pagination />
    </toolbar>
    <object
      keyName="content"
      title="Content"
      ui="editor"
      defaultValue={{
        html: "<p></p>",
        __typename: null
      }}
    />
    <dateTime
      keyName="expiryDate"
      title="${anno.expiryDate}" packageName="../src/cms-components/customize-string-date.tsx"
      uiParams={{
        minuteStep: 30
      }}
    />
    <boolean keyName="global" title="${anno.global}" />
    <GroupRelation />
    <boolean keyName="sendEmail" title="${anno.sendEmail}" packageName="../src/cms-components/customize-boolean-send_email.tsx" />
    <string
      defaultValue="published"
      keyName="status"
      packageName="../src/cms-components/customize-string-buttons.tsx"
    />
  </array>
)
