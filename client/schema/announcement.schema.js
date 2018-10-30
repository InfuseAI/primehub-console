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
        title: '${content}',
        dataIndex: 'content',
        render: renderContent
      }, {
        title: '${expiryDate}',
        dataIndex: 'expiryDate'
      }, {
        title: '${global}',
        dataIndex: 'global'
      }, {
        title: '${sendEmail}',
        dataIndex: 'sendEmail'
      }, {
        title: '${status}',
        dataIndex: 'status',
        render: text => 
      }, {
        title: '${projectGpuQuota}',
        dataIndex: 'projectQuotaGpu',
        render: text => {
          return text === null ? '∞' : text;
        }
      }]
    }}
  >
     <toolbar async>
      <pagination />
    </toolbar>
    <object keyName="content" title="Content" ui="editor" />
    <dateTime keyName="expiryDate" title="${expiryDate}" packageName="../src/cms-components/customize-string-date.tsx"/>
    <boolean keyName="global" title="${global}" />
    <GroupRelation />
    <boolean keyName="sendEmail" title="${sendEmail}" packageName="../src/cms-components/customize-boolean-send_email.tsx" />
  </array>
)
