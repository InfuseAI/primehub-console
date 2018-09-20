import React from 'react';
import firebase from 'firebase';
import {FirebaseClientService} from '@canner/image-service-config';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {ImgurService} from '@canner/image-service-config';
import {FormattedMessage} from 'react-intl';

exports.graphqlClient = new GraphqlClient({
  uri: "/graphql",
  credentials: "same-origin"
});

exports.storage = new ImgurService({
  clientId: "cd7b1ab0aa39732",
  mashapeKey: "bF1fkS9EKrmshtCbRspDUxPL5yhCp1rzz8ejsnqLqwI2KQC3s9"
}).getServiceConfig();
exports.renderRelationField = function(text, record) {
  return <span>
    {text.length}
  </span>
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
    // system
    system: 'System',
    name: 'Name',
    logo: 'Logo',
    systemSettings: 'System Settings',
    defaultUserDiskQuota: 'Default User Disk Quota',
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
    personalDiskQuota: 'Personal Disk Quota',
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
    projectGpuQuota: 'Project GPU Quota',
    diskQuota: 'Disk Quota',
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
    clientSecret: 'ClientSecret'
  },
  zh: {
    // system
    system: '系統',
    name: '名稱',
    logo: '商標',
    systemSettings: '系統設定',
    defaultUserDiskQuota: '預設用戶硬碟額度',
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
    personalDiskQuota: '私人硬碟額度',
    groups: 'Groups',
    group: 'Groups',
    sendEmail: 'Send Email',
    resetPassword: 'Reset Password',
    displayName: 'Display Name',
    canUseGpu: 'Can Use GPU',
    cpuLimit: 'CPU Limit',
    cpuQuota: 'CPU Quota',
    gpuQuota: 'GPU Quota',
    projectGpuQuota: 'Project GPU Quota',
    diskQuota: 'Disk Quota',
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
    clientSecret: 'ClientSecret'
  }
}
