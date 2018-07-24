/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <object keyName="config" packageName='../../src/cms-components/customize-object-options'
    uiParams={{
      selectedKey: 'providerId',
      options: [{
        title: 'SAML Config',
        key: 'saml',
        renderKeys: [
          '', 'singleSignOnServiceUrl', 'backchannelSupported',
          'nameIDPolicyFormat', 'postBindingResponse', 'postBindingAuthnRequest',
          'postBindingLogout', 'wantAuthnRequestsSigned', 'wantAssertionsSigned',
          'forceAuthn', 'validateSignature', 'samlXmlKeyNameTranformer', 'signatureAlgorithm',
          'useJwksUrl'
        ]
      }, {
        title: 'OIDC Config',
        key: 'oidc',
        renderKeys: [
          'hideOnLoginPage', 'loginHint', 'validateSignature',
          'clientId', 'tokenUrl', 'authorizationUrl', 'disableUserInfo',
          'clientSecret', 'backchannelSupported', 'useJwksUrl'
        ]
      }]
    }}
  >
    <string keyName="hideOnLoginPage" title="Hide on Login Page" layout="horizontal"/>
    <string keyName="singleSignOnServiceUrl" title="Single Sign-On Service URL" layout="horizontal"/>
    <string keyName="backchannelSupported" title="Backchannel Logout" layout="horizontal"/>
    <string keyName="nameIDPolicyFormat" title="NameID Policy Format"
      ui="select"
      uiParams={{
        options: [{
          text: 'Persistent',
          value: 'persistent'
        }]
      }}
    layout="horizontal"/>
    <string keyName="postBindingResponse" title="HTTP-POST Binding Response" layout="horizontal"/>
    <string keyName="postBindingAuthnRequest" title="HTTP-POST Binding for AuthnRequest" layout="horizontal"/>
    <string keyName="postBindingLogout" title="HTTP-POST Binding Logout" layout="horizontal"/>
    <string keyName="wantAuthnRequestsSigned" title="Want AuthnRequests Signed" layout="horizontal"/>
    <string keyName="wantAssertionsSigned" title="Want Assertions Signed" layout="horizontal"/>
    <string keyName="wantAssertionsEncrypted" title="Want Assertions Encrypted" layout="horizontal"/>
    <string keyName="forceAuthn" title="Force Authentication" layout="horizontal"/>
    <string keyName="validateSignature" title="Validate Signature" layout="horizontal"/>
    <string keyName="samlXmlKeyNameTranformer" title="SamlXmlKeyNameTranformer" layout="horizontal"/>
    <string keyName="signatureAlgorithm" title="SignatureAlgorithm" layout="horizontal"/>
    <string keyName="useJwksUrl" title="UseJwksUrl" layout="horizontal"/>

    <string keyName="loginHint" title="LoginHint" layout="horizontal"/>
    <string keyName="clientId" title="ClientId" layout="horizontal"/>
    <string keyName="tokenUrl" title="TokenUrl" layout="horizontal"/>
    <string keyName="authorizationUrl" title="AuthorizationUrl" layout="horizontal"/>
    <string keyName="disableUserInfo" title="DisableUserInfo" layout="horizontal"/>
    <string keyName="clientSecret" title="ClientSecret" layout="horizontal"/>
  </object>
);
