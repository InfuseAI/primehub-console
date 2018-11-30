/** @jsx CannerScript */
import CannerScript from 'canner-script';

export default () => (
  <array ui="tableRoute"
    keyName="secret"
    title="Secret"
    uiParams={{
      columns: [{
        title: 'Name',
        dataIndex: 'name'
      }, {
        title: 'Display Name',
        dataIndex: 'displayName'
      }]
    }}
  >
    <string keyName="name" title="${name}" />
    <string keyName="displayName" title="${displayName}" />
    <string keyName="secret" title="${secret}" ui="textarea" />
  </array>
)