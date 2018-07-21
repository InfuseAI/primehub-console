/** @jsx builder */
import builder from 'canner-script';
// TODO: config should appear according to alias
export default () => (
  <array keyName="idp" title="Identity Provider"
    ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'Alias',
        dataIndex: 'alias'
      }]
    }}
  >
    <string keyName="alias" title="Alias"
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
    />
    <string keyName="internalId" title="InternalId" />
    <string keyName="providerId" title="ProviderId" />
    <boolean keyName="enabled" title="Enabled" />
    <string keyName="updateProfileFirstLoginMode" title="Update Profile First Login Mode" />
    <boolean keyName="trustEmail" title="Trust Email" />
    <boolean keyName="storeToken" title="Store Token" />
    <boolean keyName="addReadTokenRoleOnCreate" title="Add Read Token Role on Create" />
    <boolean keyName="authenticateByDefault" title="Authenticate by Default" />
    <boolean keyName="linkOnly" title="Account Linking Only" />
    <string keyName="firstBrokerLoginFlowAlias" title="First Login Flow"
      ui="select"
      uiParams={{
        options: [{
          text: 'first broker login',
          value: 'first broker login'
        }]
      }}
    />
  </array>
)