/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <object keyName="config1" title="Config1" >
    <string keyName="hideOnLoginPage" title="HideOnLoginPage" />
    <string keyName="loginHint" title="LoginHint" />
    <string keyName="validateSignature" title="ValidateSignature" />
    <string keyName="clientId" title="ClientId" />
    <string keyName="tokenUrl" title="TokenUrl" />
    <string keyName="authorizationUrl" title="AuthorizationUrl" />
    <string keyName="disableUserInfo" title="DisableUserInfo" />
    <string keyName="clientSecret" title="ClientSecret" />
    <string keyName="backchannelSupported" title="BackchannelSupported" />
    <string keyName="useJwksUrl" title="UseJwksUrl" />
  </object>
)