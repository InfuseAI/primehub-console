/** @jsx builder */
import builder, {Tabs, Default} from 'canner-script';
// TODO: config should appear according to alias
import Config from './config.schema';

export default () => (
  <array keyName="idp"
    ui="tableRoute"
    title="${idp}"
    uiParams={{
      columns: [{
        title: '${alias}',
        dataIndex: 'alias'
      }, {
        title: '${providerId}',
        dataIndex: 'providerId'
      }]
    }}
  >
    <Tabs>
    <Default keyName="idp" title="${idp}">
      <string keyName="alias" title="${alias}" layout="horizontal"/>
      <string keyName="providerId"
        ui="select"
        title="${providerId}"
        uiParams={{
          options: [{
            text: 'saml',
            value: 'saml'
          }, {
            text: 'oidc',
            value: 'oidc'
          }]
        }}
      layout="horizontal"/>
      {/* <string keyName="internalId" title="InternalId" layout="horizontal"/> */}
      <boolean keyName="enabled" title="${enabled}" layout="horizontal"/>
      <boolean keyName="updateProfileFirstLoginMode" title="${updateProfileFirstLoginMode}" layout="horizontal"/>
      <boolean keyName="trustEmail" title="${trustEmail}" layout="horizontal"/>
      <boolean keyName="storeToken" title="${storeToken}" layout="horizontal"/>
      <boolean keyName="addReadTokenRoleOnCreate" title="${addReadTokenRoleOnCreate}" layout="horizontal"/>
      <boolean keyName="authenticateByDefault" title="${authenticateByDefault}" layout="horizontal"/>
      <boolean keyName="linkOnly" title="${linkOnly}" layout="horizontal"/>
      <string keyName="firstBrokerLoginFlowAlias" 
        ui="select"
        title="${firstBrokerLoginFlowAlias}"
        uiParams={{
          options: [{
            text: '${firstBrokerLogin}',
            value: 'first broker login'
          }]
        }}
      layout="horizontal"/>
    </Default>
    <Default keyName="config" title="${config}">
      <Config />
    </Default>
    </Tabs>
  </array>
)