import React from 'react';
import firebase from 'firebase';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {ImgurStorage} from '@canner/storage';
import {FormattedMessage} from 'react-intl';
import {Tag, Button, Icon} from 'antd';

exports.graphqlClient = new GraphqlClient({
  uri: window.graphqlEndpoint,
  headers: {
    authorization: `Bearer ${window.localStorage.getItem('canner.accessToken')}`
  }
});

exports.imageStorage = new ImgurStorage({
  clientId: "cd7b1ab0aa39732",
  mashapeKey: "bF1fkS9EKrmshtCbRspDUxPL5yhCp1rzz8ejsnqLqwI2KQC3s9"
});
exports.renderRelationField = function(text, record) {
  return <span>
    {text.length}
  </span>
}

exports.renderContent = function(content) {
  var html = content ? content.html : '<p>-</p>';
  var div = document.createElement("div");
  div.innerHTML = html;
  var text = div.textContent || div.innerText || "";
  return (
    <div
      style={{
        width: 160,
        height: 30,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden'
      }}
    >
      {text || '-'}
    </div>
  );
}
exports.renderStatus = function(status) {
  if (status === 'published') {
    return <Tag color="green">Published</Tag>
  } else {
    // draft
    return <Tag color="orange">Draft</Tag>;
  }
}

exports.renderActions = function(text, record, cannerProps) {
  const {refId, onChange, deploy, goTo, intl} = cannerProps;
  const {id, __index} = record;
  const key = refId.getPathArr()[0];

  function send() {
    console.log(record);
    console.log(refId.child(__index).child('status'));
    onChange(refId.child(__index).child('status'), 'update', 'published')
      .then(() => {
        deploy(key);
      });
  }

  function edit() {
    goTo({
      pathname: `/${key}/${id}`
    })
  }

  function goToDelete() {
    confirm({
      title: intl.formatMessage({id: "array.table.delete.confirm"}),
      okType: 'danger',
      onOk() {
        onChange(refId.child(__index), 'delete').then(() => {
          deploy(key);
        });
      }
    });
  }

  return (
    <React.Fragment>
      <Button type="primary" onClick={send} disabled={record.status === 'published'}>
        <Icon type="notification" theme="filled" style={{color: 'white'}} />
        Send
      </Button>
      <Button.Group style={{marginLeft: 8}}>
        <Button icon="edit" onClick={edit}></Button>
        <Button icon="delete" onClick={goToDelete}></Button>
      </Button.Group>
    </React.Fragment>
  )
}

exports.SendEmailTitle = <FormattedMessage
  id="sendEmail"
  defaultMessage="Send Email"
/>

exports.ResetPasswordTitle = <FormattedMessage
  id="resetPassword"
  defaultMessage="Reset Password"
/>;
exports.parseToStepDot5 = function(value) {
  let [int, float] = value.split('.');
  if (!float) {
    return value;
  }
  float = float[0];
  if (float && float < 3) {
    return `${int}.0`;
  }
  if (float && float < 8) {
    return `${int}.5`;
  }
  if (float && float < 10) {
    return `${1 + Number(int)}.0`;
  }
}
exports.dict = {
  en: {
    // common
    quotaForNewly: 'It only works for newly created volume.',
    // system
    system: 'System',
    timezone: 'Timezone',
    name: 'Name',
    logo: 'Logo',
    systemSettings: 'System Settings',
    defaultUserVolumeCapacity: 'Default User Volume Capacity',
    users: 'Users',
    basicInfo: 'Basic Info',
    username: 'Username',
    email: 'Email',
    firstName: 'First Name',
    lastName: 'Last Name',
    completeName: 'Name',
    totp: 'Totp',
    isAdmin: 'Is Admin',
    enabled: 'Enabled',
    volumeCapacity: 'Personal Volume Capacity',
    'user.sendEmail': 'Send activation email',
    'user.resetActions': 'Actions',
    'user.expiresIn': 'Expires In',
    groups: 'Groups',
    group: 'Groups',
    sendEmail: 'Send Email',
    resetPassword: 'Reset Password',
    displayName: 'Display Name',
    canUseGpu: 'Can Use GPU',
    canUseGPU: 'Can Use GPU',
    cpuLimit: 'CPU Limit',
    cpuQuota: 'CPU Quota',
    gpuQuota: 'GPU Quota',
    cpuQuotaListTitle: 'User CPU Quota',
    gpuQuotaListTitle: 'User GPU Quota',
    memQuota: 'Mem Quota',
    projectCpuQuota: 'Group CPU Quota',
    projectGpuQuota: 'Group GPU Quota',
    projectMemQuota: 'Group Mem Quota',
    quotaMemory: 'Memory Quota',
    groupQuota: 'Group Quota',
    userVolumeCapacity: 'User Volume Capacity',
    // instance type
    instanceTypes: 'Instance Types',
    memoryLimit: 'Memory Limit',
    gpuLimit: 'GPU Limit',
    cpuRequest: 'CPU Request',
    memoryRequest: 'Memory Request',

    // dataset
    dataset: 'Datasets',
    description: 'Description',
    type: 'Type',
    images: 'Images',
    global: 'Global',
    url: 'Url',
    variables: 'Variables',
    variables: 'Variables',
    config: 'Config',
    priority: 'Priority',
    requiredSettings: 'Required Settings',
    syncRegistrations: 'Sync Registrations',
    vendor: 'Vendor',
    access: 'Access',
    volumeName: 'Volume Name',
    // userfederation
    userFederations: 'User Federations',
    basicInformation: 'Basic Information',
    requiredSettings: 'Required Settings',
    importEnabled: 'Import Enabled',
    syncRegistrations: 'Sync Registrations',
    usernameLDAPAttribute: 'Username LDAP attribute',
    rdnLDAPAttribute: 'RDN LDAP attribute',
    uuidLDAPAttribute: 'UUID LDAP attribute',
    userObjectClasses: 'User Object Classes',
    connectionUrl: 'Connection URL',
    usersDn: 'Users DN',
    authType: 'Authentication Type',
    bindDn: 'Bind DN',
    bindCredential: 'Bind Credential',
    searchScope: 'Search Scope',
    validatePasswordPolicy: 'Validate Password Policy',
    useTruststoreSpi: 'Use Truststore Spi',
    connectionPooling: 'Connection Pooling',
    lastSync: 'Last Sync',
    debug: 'Debug',
    pagination: 'Pagination',
    kerberosIntegration: 'Kerberos Integration',
    allowKerberosAuthentication: 'Allow Kerberos Authentication',
    useKerberosForPasswordAuthentication: 'Use Kerberos for Password Authentication',
    syncSetting: 'Sync Setting',
    batchSizeForSync: 'Batch Size for Sync',
    fullSyncPeriod: 'Full Sync Period',
    changedSyncPeriod: 'Changed Sync Period',
    cacheSettings: 'Cache Settings',
    cachePolicy: 'Cache Policy',

    linkOnly: 'Account Linking Only',
    firstBrokerLoginFlowAlias: 'First Login Flow',
    // idp
    idp: 'Identity Provider',
    alias: 'Alias',
    providerId: 'Provider Id',
    enabled: 'Enabled',
    updateProfileFirstLoginMode: 'Update Profile First Login Mode',
    trustEmail: 'Trust Email',
    storeToken: 'Store Token',
    ReadTokenRoleOnCreate: 'Add Read Token Role on Create',
    authenticateByDefault: 'Authenticate by Default',
    linkOnly: 'Link Only',
    firstBrokerLoginFlowAlias: 'First Broker Login Flow Alias',
    firstBrokerLogin: 'first broker login',
    // config
    saml: 'SAML Config',
    oidc: 'OIDC Config',
    hideOnLoginPage: 'Hide on Login Page',
    singleSignOnServiceUrl: 'Single Sign-On Service URL',
    backchannelSupported: 'Backchannel Logout',
    nameIDPolicyFormat: 'NameID Policy Format',
    postBindingResponse: 'HTTP-POST Binding Response',
    postBindingAuthnRequest: 'HTTP-POST Binding for AuthnRequest',
    postBindingLogout: 'HTTP-POST Binding Logout',
    wantAuthnRequestsSigned: 'Want AuthnRequests Signed',
    wantAssertionsSigned: 'Want Assertions Signed',
    wantAssertionsEncrypted: 'Want Assertions Encrypted',
    forceAuthn: 'Force Authentication',
    validateSignature: 'Validate Signature',
    samlXmlKeyNameTranformer: 'SamlXmlKeyNameTranformer',
    signatureAlgorithm: 'SignatureAlgorithm',
    useJwksUrl: 'UseJwksUrl',
    loginHint: 'LoginHint',
    clientId: 'ClientId',
    tokenUrl: 'TokenUrl',
    authorizationUrl: 'AuthorizationUrl',
    disableUserInfo: 'DisableUserInfo',
    clientSecret: 'ClientSecret',

    // smtp
    smtpSettings: 'Email Settings',
    'smtp.host': 'Smtp Host',
    'smtp.port': 'Smtp port',
    'smtp.fromDisplayName': 'From Display Name',
    'smtp.from': 'From',
    'smtp.replyToDisplayName': 'Reply To Display Name',
    'smtp.replyTo': 'Reply To',
    'smtp.envelopeFrom': 'Envelope From',
    'smtp.enableSSL': 'Enable SSL',
    'smtp.enableStartTLS': 'Enable StartTLS',
    'smtp.enableAuth': 'Enable Authentication',
    'smtp.auth.username': 'Username',
    'smtp.auth.password': 'Password',

    // announcement
    announcement: "Announcements",
    'anno.title': 'Title',
    'anno.content': 'Content',
    'anno.expiryDate': 'Expiry Date',
    'anno.global': 'Global',
    'anno.sendEmail': 'Send Email',
    'anno.status': 'Status',
    'anno.actions': 'Actions',
    'anno.sendEmailMessage': 'Also send announcement via email.',

    // secret
    secret: 'Secret'
  },
  zh: {
    // common
    quotaForNewly: 'It only works for newly created volume.',
    // system
    system: '系統',
    timezone: '時區',
    name: '名稱',
    logo: '商標',
    systemSettings: '系統設定',
    defaultUserVolumeCapacity: '預設用戶硬碟額度',
    users: '用戶',
    basicInfo: '基本資訊',
    username: '使用者名稱',
    email: '電子郵件',
    firtName: '名',
    lastName: '姓',
    completeName: '姓名',
    totp: 'Totp',
    isAdmin: '是否為管理者',
    enabled: 'Enabled',
    'user.sendEmail': '寄送認證信',
    'user.resetActions': '信件類別',
    'user.expiresIn': '認證期限',
    volumeCapacity: '私人硬碟額度',
    groups: 'Groups',
    readOnlyGroups: 'Readonly Groups',
    writableGroups: 'Writable Groups',
    group: 'Groups',
    sendEmail: 'Send Email',
    resetPassword: 'Reset Password',
    displayName: 'Display Name',
    canUseGpu: 'Can Use GPU',
    cpuLimit: 'CPU Limit',
    cpuQuota: 'CPU Quota',
    gpuQuota: 'GPU Quota',
    cpuQuotaListTitle: 'User CPU Quota',
    gpuQuotaListTitle: 'User GPU Quota',
    memQuota: 'Mem Quota',
    projectCpuQuota: 'Group CPU Quota',
    projectGpuQuota: 'Group GPU Quota',
    projectMemQuota: 'Group Mem Quota',
    quotaMemory: 'Memory Quota',
    userVolumeCapacity: 'User Volume Capacity',
    // instance type
    instanceTypes: 'Instance Types',
    memoryLimit: 'Memory Limit',
    gpuLimit: 'GPU Limit',
    cpuRequest: 'CPU Request',
    memoryRequest: 'Memory Request',

    // dataset
    dataset: 'Dataset',
    description: 'Description',
    type: 'Type',
    images: 'Images',
    global: 'Global',
    url: 'Url',
    variables: 'Variables',
    variables: 'Variables',
    config: 'Config',
    priority: 'Priority',
    requiredSettings: 'Required Settings',
    syncRegistrations: 'Sync Registrations',
    vendor: 'Vendor',
    access: 'Access',
    volumeName: 'Volume Name',
    // userfederation
    userFederations: 'User Federations',
    basicInformation: 'Basic Information',
    requiredSettings: 'Required Settings',
    importEnabled: 'Import Enabled',
    syncRegistrations: 'Sync Registrations',
    usernameLDAPAttribute: 'Username LDAP attribute',
    rdnLDAPAttribute: 'RDN LDAP attribute',
    uuidLDAPAttribute: 'UUID LDAP attribute',
    userObjectClasses: 'User Object Classes',
    connectionUrl: 'Connection URL',
    usersDn: 'Users DN',
    authType: 'Authentication Type',
    bindDn: 'Bind DN',
    bindCredential: 'Bind Credential',
    searchScope: 'Search Scope',
    validatePasswordPolicy: 'Validate Password Policy',
    useTruststoreSpi: 'Use Truststore Spi',
    connectionPooling: 'Connection Pooling',
    lastSync: 'Last Sync',
    debug: 'Debug',
    pagination: 'Pagination',
    kerberosIntegration: 'Kerberos Integration',
    allowKerberosAuthentication: 'Allow Kerberos Authentication',
    useKerberosForPasswordAuthentication: 'Use Kerberos for Password Authentication',
    syncSetting: 'Sync Setting',
    batchSizeForSync: 'Batch Size for Sync',
    fullSyncPeriod: 'Full Sync Period',
    changedSyncPeriod: 'Changed Sync Period',
    cacheSettings: 'Cache Settings',
    cachePolicy: 'Cache Policy',

    linkOnly: 'Account Linking Only',
    firstBrokerLoginFlowAlias: 'First Login Flow',
    // idp
    idp: 'Identity Provider',
    alias: 'Alias',
    providerId: 'Provider Id',
    enabled: 'Enabled',
    updateProfileFirstLoginMode: 'Update Profile First Login Mode',
    trustEmail: 'Trust Email',
    storeToken: 'Store Token',
    ReadTokenRoleOnCreate: 'Add Read Token Role on Create',
    authenticateByDefault: 'Authenticate by Default',
    linkOnly: 'Link Only',
    firstBrokerLoginFlowAlias: 'First Broker Login Flow Alias',
    firstBrokerLogin: 'first broker login',
    // config
    saml: 'SAML Config',
    oidc: 'OIDC Config',
    hideOnLoginPage: 'Hide on Login Page',
    singleSignOnServiceUrl: 'Single Sign-On Service URL',
    backchannelSupported: 'Backchannel Logout',
    nameIDPolicyFormat: 'NameID Policy Format',
    postBindingResponse: 'HTTP-POST Binding Response',
    postBindingAuthnRequest: 'HTTP-POST Binding for AuthnRequest',
    postBindingLogout: 'HTTP-POST Binding Logout',
    wantAuthnRequestsSigned: 'Want AuthnRequests Signed',
    wantAssertionsSigned: 'Want Assertions Signed',
    wantAssertionsEncrypted: 'Want Assertions Encrypted',
    forceAuthn: 'Force Authentication',
    validateSignature: 'Validate Signature',
    samlXmlKeyNameTranformer: 'SamlXmlKeyNameTranformer',
    signatureAlgorithm: 'SignatureAlgorithm',
    useJwksUrl: 'UseJwksUrl',
    loginHint: 'LoginHint',
    clientId: 'ClientId',
    tokenUrl: 'TokenUrl',
    authorizationUrl: 'AuthorizationUrl',
    disableUserInfo: 'DisableUserInfo',
    clientSecret: 'ClientSecret',

    // smtp
    smtpSettings: 'Smtp 設定',
    'smtp.host': 'Smtp Host',
    'smtp.port': 'Smtp Port',
    'smtp.fromDisplayName': 'From Display Name',
    'smtp.from': 'From',
    'smtp.replyToDisplayName': 'Reply To Display Name',
    'smtp.replyTo': 'Reply To',
    'smtp.envelopeFrom': 'Envelope From',
    'smtp.enableSSL': 'Enable SSL',
    'smtp.enableStartTLS': 'Enable StartTLS',
    'smtp.enableAuth': 'Enable Authentication',
    'smtp.auth.username': 'Username',
    'smtp.auth.password': 'Password',

    // announcement
    announcement: "Announcements",
    'anno.title': 'Title',
    'anno.content': 'Content',
    'anno.expiryDate': 'Expiry Date',
    'anno.global': 'Global',
    'anno.sendEmail': 'Send Email',
    'anno.status': 'Status',
    'anno.actions': 'Actions',
    'anno.sendEmailMessage': 'Also send announcement via email.',

    // secret
    secret: 'Secret'
  }
}
