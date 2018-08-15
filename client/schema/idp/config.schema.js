/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <object keyName="config" packageName='../../src/cms-components/customize-object-options'
    uiParams={{
      selectedKey: 'providerId',
      options: [{
        title: '${saml}',
        key: 'saml',
        renderKeys: [
          '', 'singleSignOnServiceUrl', 'backchannelSupported',
          'nameIDPolicyFormat', 'postBindingResponse', 'postBindingAuthnRequest',
          'postBindingLogout', 'wantAuthnRequestsSigned', 'wantAssertionsSigned',
          'forceAuthn', 'validateSignature', 'samlXmlKeyNameTranformer', 'signatureAlgorithm',
          'useJwksUrl'
        ]
      }, {
        title: '${oidc}',
        key: 'oidc',
        renderKeys: [
          'hideOnLoginPage', 'loginHint', 'validateSignature',
          'clientId', 'tokenUrl', 'authorizationUrl', 'disableUserInfo',
          'clientSecret', 'backchannelSupported', 'useJwksUrl'
        ]
      }]
    }}
  >
    <string keyName="hideOnLoginPage" title="${hideOnLoginPage}" layout="horizontal"/>
    <string keyName="singleSignOnServiceUrl" title="${singleSignOnServiceUrl}" layout="horizontal"/>
    <string keyName="backchannelSupported" title="${backchannelSupported}" layout="horizontal"/>
    <string keyName="nameIDPolicyFormat"
      ui="select"
      title="${nameIDPolicyFormat}"
      uiParams={{
        options: [{
          text: 'Persistent',
          value: 'persistent'
        }]
      }}
    layout="horizontal"/>
    <string keyName="postBindingResponse" title="${postBindingResponse}" layout="horizontal"/>
    <string keyName="postBindingAuthnRequest" title="${postBindingAuthnRequest}" layout="horizontal"/>
    <string keyName="postBindingLogout" title="${postBindingLogout}" layout="horizontal"/>
    <string keyName="wantAuthnRequestsSigned" title="${wantAuthnRequestsSigned}" layout="horizontal"/>
    <string keyName="wantAssertionsSigned" title="${wantAssertionsSigned}" layout="horizontal"/>
    <string keyName="wantAssertionsEncrypted" title="${wantAssertionsEncrypted}" layout="horizontal"/>
    <string keyName="forceAuthn" title="${forceAuthn}" layout="horizontal"/>
    <string keyName="validateSignature" title="${validateSignature}" layout="horizontal"/>
    <string keyName="samlXmlKeyNameTranformer" title="${samlXmlKeyNameTranformer}" layout="horizontal"/>
    <string keyName="signatureAlgorithm" title="${signatureAlgorithm}" layout="horizontal"/>
    <string keyName="useJwksUrl" title="${useJwksUrl}" layout="horizontal"/>

    <string keyName="loginHint" title="${loginHint}" layout="horizontal"/>
    <string keyName="clientId" title="${clientId}" layout="horizontal"/>
    <string keyName="tokenUrl" title="${tokenUrl}" layout="horizontal"/>
    <string keyName="authorizationUrl" title="${authorizationUrl}" layout="horizontal"/>
    <string keyName="disableUserInfo" title="${disableUserInfo}" layout="horizontal"/>
    <string keyName="clientSecret" title="${clientSecret}" layout="horizontal"/>
  </object>
);
