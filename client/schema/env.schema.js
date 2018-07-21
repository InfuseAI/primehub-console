/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <array keyName="env" title="Env" ui="tableRoute">
    <string keyName="name" title="Name" />
    <string keyName="image" title="Image" />
    <boolean keyName="global" title="Global" />
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