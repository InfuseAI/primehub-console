/** @jsx builder */
import builder, {Condition, Block, Row, Col} from 'canner-script';
import {Tag} from 'antd';
import Filter from '../src/cms-toolbar/filter';
import {renderContent} from './utils';
import {GroupRelation} from './utils.schema';

export default () => (
  <array keyName="announcement" title="${announcement}"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    ui="tableRoute"
    uiParams={{
      disableDelete: true,
      updateKeys: [],
      columns: [{
        title: '${anno.content}',
        dataIndex: 'content',
        render: renderContent
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
        dataIndex: 'status'
      }]
    }}
  >
     <toolbar async>
      <pagination />
    </toolbar>
    <object keyName="content" title="Content" ui="editor" />
    <dateTime keyName="expiryDate" title="${anno.expiryDate}" packageName="../src/cms-components/customize-string-date.tsx"/>
    <boolean keyName="global" title="${anno.global}" />
    <GroupRelation />
    <boolean keyName="sendEmail" title="${anno.sendEmail}" packageName="../src/cms-components/customize-boolean-send_email.tsx" />
  </array>
)
