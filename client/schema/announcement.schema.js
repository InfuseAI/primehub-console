/** @jsx builder */
import builder, {Condition, Block, Row, Col} from 'canner-script';
import {Tag} from 'antd';
import Filter from '../src/cms-toolbar/filter';
import TabsFilter from '../src/cms-toolbar/tabsFilter.tsx';
import {renderContent, renderStatus, renderActions} from './utils';
import {GroupRelation} from './utils.schema';
import moment from 'moment';

export default () => (
  <array keyName="announcement" title="${announcement}"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    hideButtons={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      announcementCustomActions: true,
      removeActions: true,
      columns: [{
        title: '${anno.content}',
        dataIndex: 'content',
        width: 160,
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
        dataIndex: 'status',
        render: renderStatus
      }]
    }}
  >
     <toolbar async>
      <filter component={TabsFilter} defaultFilter={{
        expiryDate_gt: moment().toISOString()
      }}/>
      <pagination />
    </toolbar>
    <string
      keyName="title"
      title="${anno.title}"
      packageName="../src/cms-components/customize-string-input"
      hideTitle
      uiParams={{
        maxLength: 40
      }}
    />
    <object
      keyName="content"
      title="Content"
      ui="editor"
      defaultValue={{
        html: "<p></p>",
        __typename: null
      }}
      uiParams={{
        toolbar: [
          ['bold', 'italic', 'underline','strike'],
          [{'list': 'ordered'}, {'list': 'bullet'}],
          ['link'],
          ['clean']
        ],
        formats: [
          'bold', 'italic', 'underline', 'strike',
          'list', 'bullet',
          'link'
        ]
      }}
    />
    <dateTime
      keyName="expiryDate"
      defaultValue={() => moment().toISOString()}
      title="${anno.expiryDate}" packageName="../src/cms-components/customize-string-date.tsx"
      uiParams={{
        minuteStep: 30
      }}
    />
    <boolean keyName="global" title="${anno.global}" defaultValue={() => true}/>
    <Condition match={(data, operator) => !data.global}>
      <GroupRelation />
    </Condition>
    <boolean keyName="sendEmail" title="${anno.sendEmail}" packageName="../src/cms-components/customize-boolean-send_email.tsx" />
    <string
      defaultValue="published"
      keyName="status"
      packageName="../src/cms-components/customize-string-buttons.tsx"
    />
  </array>
)
