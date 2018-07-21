/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <object keyName="config" title="Config" >
    <string keyName="hideOnLoginPage" title="Hide on Login Page" />
    <string keyName="singleSignOnServiceUrl" title="Single Sign-On Service URL" />
    <string keyName="backchannelSupported" title="Backchannel Logout" />
    <string keyName="nameIDPolicyFormat" title="NameID Policy Format"
      ui="select"
      uiParams={{
        options: [{
          text: 'Persistent',
          value: 'persistent'
        }]
      }}
    />
    <string keyName="postBindingResponse" title="HTTP-POST Binding Response" />
    <string keyName="postBindingAuthnRequest" title="HTTP-POST Binding for AuthnRequest" />
    <string keyName="postBindingLogout" title="HTTP-POST Binding Logout" />
    <string keyName="wantAuthnRequestsSigned" title="Want AuthnRequests Signed" />
    <string keyName="wantAssertionsSigned" title="Want Assertions Signed" />
    <string keyName="wantAssertionsEncrypted" title="Want Assertions Encrypted" />
    <string keyName="forceAuthn" title="Force Authentication" />
    <string keyName="validateSignature" title="Validate Signature" />


    <string keyName="samlXmlKeyNameTranformer" title="SamlXmlKeyNameTranformer" />
    <string keyName="signatureAlgorithm" title="SignatureAlgorithm" />
    <string keyName="useJwksUrl" title="UseJwksUrl" />
  </object>
)