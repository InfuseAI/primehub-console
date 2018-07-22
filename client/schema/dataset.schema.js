/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <array keyName="dataset" title="Dataset" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'Name',
        dataIndex: 'name'
      }]
    }}
  >
    <string keyName="name" title="Name" />
    <string keyName="description" title="Description" />
    <string keyName="access" title="Access" />
    <string keyName="type" title="Type" />
    <string keyName="url" title="Url" />
    <relation keyName="groups" title="Groups"
      ui="multipleSelect"
      relation={{
        to: 'group',
        type: 'toMany'
      }}
      uiParams={{
        textCol: 'displayName',
        columns: [{
          title: 'Display Name',
          dataIndex: 'displayName'
        }]
      }}
    />
  </array>
)