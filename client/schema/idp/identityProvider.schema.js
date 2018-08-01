/** @jsx builder */
import builder, {Tabs, Default} from 'canner-script';
// TODO: config should appear according to alias
import Config from './config.schema';

export default () => (
  <array keyName="idp" title="Identity Provider"
    ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'Alias',
        dataIndex: 'alias'
      }, {
        title: 'Provider Id',
        dataIndex: 'providerId'
      }]
    }}
  >
    <Tabs>
    <Default keyName="idp" title="Identity Provider">
      <string keyName="alias" title="Alias" layout="horizontal"/>
      <string keyName="providerId" title="providerId"
        ui="select"
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
      <boolean keyName="enabled" title="Enabled" layout="horizontal"/>
      <boolean keyName="updateProfileFirstLoginMode" title="Update Profile First Login Mode" layout="horizontal"/>
      <boolean keyName="trustEmail" title="Trust Email" layout="horizontal"/>
      <boolean keyName="storeToken" title="Store Token" layout="horizontal"/>
      <boolean keyName="addReadTokenRoleOnCreate" title="Add Read Token Role on Create" layout="horizontal"/>
      <boolean keyName="authenticateByDefault" title="Authenticate by Default" layout="horizontal"/>
      <boolean keyName="linkOnly" title="Account Linking Only" layout="horizontal"/>
      <string keyName="firstBrokerLoginFlowAlias" title="First Login Flow"
        ui="select"
        uiParams={{
          options: [{
            text: 'first broker login',
            value: 'first broker login'
          }]
        }}
      layout="horizontal"/>
    </Default>
    <Default keyName="config" title="Config">
      <Config />
    </Default>
    </Tabs>
  </array>
)