import React from 'react';
import GraphqlClient from 'canner-graphql-interface/lib/graphqlClient/graphqlClient';
import {ImgurStorage} from '@canner/storage';
import {FormattedMessage} from 'react-intl';
import {Tag, Button, Icon, Tooltip} from 'antd';

export const groupColumns = [{
  title: '${name}',
  dataIndex: 'name',
  render: (text, record, cannerProps) => {
    const onClick = () => {
      const currentPath = cannerProps.routes.join('/');
      cannerProps.goTo({
        pathname: `/group/${record.id}`,
        payload: {
          backTo: currentPath
        }
      })
    }
    return <a onClick={onClick}>{text}</a>;
  }
}, {
  title: '${displayName}',
  dataIndex: 'displayName'
}, , {
  title: '${cpuQuota}',
  dataIndex: 'quotaCpu',
  render: text => {
    return text === null ? '∞' : text;
  },
  visible: !modelDeploymentOnly
}, {
  title: '${gpuQuota}',
  dataIndex: 'quotaGpu',
  render: text => {
    return text === null ? '∞' : text;
  },
  visible: !modelDeploymentOnly
}
];

export const groupPickerColumns =  [{
  title: '${name}',
  dataIndex: 'name',
  sorter: true,
}].concat(groupColumns.slice(1));

exports.InvalidChError = <React.Fragment>
  Invalid characters: &nbsp;
  <Tag color="red">;</Tag>
  <Tag color="red">|</Tag>
  <Tag color="red">#</Tag>
  <Tag color="red">\</Tag>
  <Tag color="red">"</Tag>
  <Tag color="red">'</Tag>
  <Tag color="red">`</Tag>
</React.Fragment>

exports.graphqlClient = new GraphqlClient({
  uri: window.graphqlEndpoint,
  fetch: (uri, options) => {
    const token = window.localStorage.getItem('canner.accessToken');
    options.headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers || {}
    };
    return fetch(uri, options);
  },
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

exports.renderUploadServerLink = function(text, record) {
  if (text) {
    return <a href={text} target="_blank">
      Link
    </a>
  }
  return '-';
}

class CopyableText extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipVisible: false
    }
  }

  copy = () => {
    this.textRef.select();

    try {
      let status = document.execCommand("Copy");
      if(!status) {
        console.log('Cannot copy text');
        this.setState({
          tooltipVisible: false
        });
      } else {
        this.setState({
          tooltipVisible: true
        });
        setTimeout(() => {
          this.setState({
            tooltipVisible: false
          });
        }, 1000)

      }
    } catch(err) {
      this.setState({
        tooltipVisible: false
      });
      console.log('Could not copy');
    }
  }

  render() {
    const {children} = this.props;
    const {tooltipVisible} = this.state;
    return (
      <>
        <input
          style={{
            outline: 'none',
            border: 0,
            background: 'transparent',
            width: '250px'
          }}
          value={children}
          ref={text => this.textRef = text}
        />
        <Tooltip placement="top" title={"copied"} visible={tooltipVisible}>
          <Button icon="copy" onClick={this.copy}></Button>
        </Tooltip>
      </>
    )
  }
}

exports.renderCopyableText = function(text, record) {
  if (text) {
    return <CopyableText>
      {text}
    </CopyableText>
  }
  return '-';
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

exports.renderTextWithTooltip = function(text, tooltipText) {
  return <>
    {text}
    <Tooltip
      title={tooltipText}
    >
      <Icon
        type="info-circle"
        theme="filled"
        style={{marginLeft: 8}}
      />
    </Tooltip>
  </>
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

const instanceTypeLink = "https://docs.primehub.io/docs/guide_manual/admin-instancetype#overcommitting-advanced-feature";
const imageBuilderLink = "https://docs.primehub.io/docs/getting_started/configure-image-builder";

exports.dict = {
  en: {
    // common
    quotaForNewly: 'It only works for newly created volume.',
    // system
    system: 'System Settings',
    timezone: 'Timezone',
    name: 'Name',
    logo: 'Logo',
    systemSettings: 'System Settings',
    primehubLicense: 'PrimeHub License',
    licenseStatus: 'License Status',
    expirationDate: 'Expiration Date',
    licensedTo: 'Licensed To',
    defaultUserVolumeCapacity: 'Default User Volume Capacity',
    users: 'Users',
    members: 'Members',
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
    // group
    groups: 'Groups',
    group: 'Groups',
    "groups.enabledDeployment": "Model Deployment",
    "groups.datasets.writable": "Permissions",
    "group.enabledSharedVolume": "Shared Volume",
    "group.sharedVolumeCapacity": "Shared Volume Capacity",
    "group.launchGroupOnly": "Launch Group Only",
    "group.jobDefaultActiveDeadlineSeconds": "Default Timeout Setting",
    "group.admin": 'Group Admin',
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
    'instanceType.request.text.title': 'Overcommitting (advanced feature)',
    'instanceType.request.text.description': `
      If you want to overcommit computing resources, you can use this feature.
      <a href="${instanceTypeLink}">More Info</a>
    `,
    // dataset
    dataset: 'Datasets',
    description: 'Description',
    mountRoot: 'Mount Root',
    'mountRoot.preview': 'Data can be access at: ',
    launchGroupOnly: 'Launch Group Only',
    type: 'Type',
    images: 'Images',
    global: 'Global',
    imageUrl: 'Container Image URL',
    datasetUrl: 'URL',
    variables: 'Variables',
    config: 'Config',
    priority: 'Priority',
    requiredSettings: 'Required Settings',
    syncRegistrations: 'Sync Registrations',
    vendor: 'Vendor',
    access: 'Access',
    volumeName: 'Volume Name',
    volumeSize: 'Volume Size',
    uploadServerLink: 'Upload Server',
    'dataset.enableUploadServer': 'Enable Upload Server',
    'dataset.regenerateSecretModalTitle': 'Regenerate secret successfully, please memorize the secret below',
    'dataset.enableUploadServerModalTitle': 'Enable upload server successfully, please memorize the secret below.',
    'dataset.regenerateSecretErrorModalTitle': `Sorry.`,
    'dataset.regenerateSecretErrorModalContent': `Something went wrong, we cloudn't regenerate secret.`,
    nfsServer: 'NFS Server',
    nfsPath: 'NFS Path',
    hostPath: 'Host Path',
    pvProvisioning: 'Provisioning',

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
    'smtp.host': 'SMTP Host',
    'smtp.port': 'SMTP Port',
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
    secret: 'Secret',
    'secret.type': 'Type',
    'secret.registryHost': 'Registry Host',
    'secret.username': 'Username',
    'secret.password': 'Password',

    // image
    'images.urlForGpu': 'Specific Container Image URL for GPU',
    'images.useImagePullSecret': 'Use Image Pull Secret',
    'image.useImagePullSecret.component.select.placeholder': 'Select Secret',

    // buildImage
    'buildImage': 'Image Builder',
    'buildImage.tabs.info': 'Info',
    'buildImage.tabs.jobs': 'Jobs',
    'buildImage.name': 'Name',
    'buildImage.status': 'Status',
    'buildImage.image': 'Image',
    'buildImage.baseImage': 'Base Image',
    'buildImage.baseImage.placeholder': 'Input image url',
    'buildImage.useImagePullSecret': 'Use Image PullSecret',
    'buildImage.packages': 'Package(s)',
    'buildImage.msg.pleaseCheckSetup': 'Image registry not found. Please set up your image registry using Image Builder.',
    'buildImage.msg.registrySetupLink': imageBuilderLink,
    'buildImage.apt': 'APT',
    'buildImage.pip': 'Pip',
    'buildImage.conda': 'Conda',
    'buildImage.packages.apt.placeholder': 'one package per line. e.g. \npackage1\npackage2\n',
    'buildImage.packages.pip.placeholder': 'one package per line. e.g. \npackage1\npackage2\n',
    'buildImage.packages.conda.placeholder': 'one package per line. e.g. \npackage1\npackage2\n',
    'buildImageJob': 'Image Builder Job',
    'buildImageJob.baseImage': 'Base Image',
    'buildImageJob.targetImage': 'Image',
    'buildImageJob.imageRevision': 'Image Revision',
    'buildImageJob.updateTime': 'Updated At',
    'buildImageJob.packages': 'Packages',
    'buildImageJob.status': 'Status',
    'buildImageJob.apt': 'APT',
    'buildImageJob.pip': 'Pip',
    'buildImageJob.conda': 'Conda',
    'buildImageJob.logEndpoint': 'Logs',

    'usageReport.download.modal.title': 'This month is not over yet!',
    'usageReport.download.modal.content': 'This report will only contain usage from the 1st of this month until today. Would you like to continue to download?',
    'usageReport.table.id': 'Date',
    'usageReport.download.summary.actions': 'Summary Report',
    'usageReport.download.details.actions': 'Detailed Report',

    // maintenance notebook
    'maintenance.title': 'Maintenance',
    'maintenance.externalLink': '/maintenance',
    // grafana
    'grafana.title': 'Grafana',
    'grafana.externalLink': '/grafana/login/generic_oauth'
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
    primehubLicense: 'PrimeHub License',
    licenseStatus: '授權狀態',
    expirationDate: '授權到期時間',
    licensedTo: '授權給',
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
    // group
    groups: 'Groups',
    readOnlyGroups: 'Readonly Groups',
    writableGroups: 'Writable Groups',
    group: 'Groups',
    "groups.enabledDeployment": "Model Deployment",
    "groups.datasets.writable": "Permissions",
    "group.enabledSharedVolume": "Shared Volume",
    "group.sharedVolumeCapacity": "Shared Volume Capacity",
    "group.launchGroupOnly": "Launch Group Only",
    "group.jobDefaultActiveDeadlineSeconds": "Default Timeout Setting",
    "group.admin": 'Group Admin',
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
    'instanceType.request.text.title': 'Overcommitting (advanced feature)',
    'instanceType.request.text.description': `
      If you want to overcommit computing resources, you can use this feature.
      <a href="${instanceTypeLink}">More Info</a>
    `,
    // dataset
    dataset: 'Dataset',
    description: 'Description',
    mountRoot: 'Mount Root',
    'mountRoot.preview': 'Data can be access at: ',
    launchGroupOnly: 'Launch Group Only',
    type: 'Type',
    images: 'Images',
    global: 'Global',
    imageUrl: 'Container image url',
    datasetUrl: 'URL',
    variables: 'Variables',
    config: 'Config',
    priority: 'Priority',
    requiredSettings: 'Required Settings',
    syncRegistrations: 'Sync Registrations',
    vendor: 'Vendor',
    access: 'Access',
    volumeName: 'Volume Name',
    volumeSize: 'Volume Size',
    uploadServerLink: 'Upload Server',
    'dataset.enableUploadServer': 'Enable Upload Server',
    'dataset.regenerateSecretModalTitle': 'Regenerate secret successfully, please memorize the secret below',
    'dataset.enableUploadServerModalTitle': 'Enable upload server successfully, please memorize the secret below.',
    'dataset.regenerateSecretErrorModalTitle': `Sorry.`,
    'dataset.regenerateSecretErrorModalContent': `Something went wrong, we cloudn't regenerate secret.`,
    nfsServer: 'NFS Server',
    nfsPath: 'NFS Path',
    hostPath: 'Host Path',

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
    smtpSettings: 'SMTP 設定',
    'smtp.host': 'SMTP Host',
    'smtp.port': 'SMTP Port',
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
    secret: 'Secret',
    'secret.type': 'Type',
    'secret.registryHost': 'Registry Host',
    'secret.username': 'Username',
    'secret.password': 'Password',

    // image
    'images.urlForGpu': 'Specific Container Image URL for GPU',
    'images.useImagePullSecret': 'Use Image Pull Secret',
    'image.useImagePullSecret.component.select.placeholder': 'Select Secret',

    // buildImage
    'buildImage': 'Image Builder',
    'buildImage.tabs.info': 'Info',
    'buildImage.tabs.jobs': 'Jobs',
    'buildImage.name': 'Name',
    'buildImage.status': 'Status',
    'buildImage.image': 'Image',
    'buildImage.baseImage': 'Base Image',
    'buildImage.baseImage.placeholder': 'Input image url',
    'buildImage.useImagePullSecret': 'Use Image PullSecret',
    'buildImage.packages': 'Package(s)',
    'buildImage.apt': 'APT',
    'buildImage.pip': 'Pip',
    'buildImage.conda': 'Conda',
    'buildImage.packages.apt.placeholder': 'one package per line. e.g. \npackage1\npackage2\n',
    'buildImage.packages.pip.placeholder': 'one package per line. e.g. \npackage1\npackage2\n',
    'buildImage.packages.conda.placeholder': 'one package per line. e.g. \npackage1\npackage2\n',
    'buildImageJob': 'Image Builder Job',
    'buildImageJob.baseImage': 'Base Image',
    'buildImageJob.targetImage': 'Image',
    'buildImageJob.imageRevision': 'Image Revision',
    'buildImageJob.updateTime': 'Updated At',
    'buildImageJob.packages': 'Packages',
    'buildImageJob.status': 'Status',
    'buildImageJob.apt': 'APT',
    'buildImageJob.pip': 'Pip',
    'buildImageJob.conda': 'Conda',
    'buildImageJob.logEndpoint': 'Logs',

    'usageReport.download.modal.title': 'This month is not over yet!',
    'usageReport.download.modal.content': 'This report will only contain usage from the 1st of this month until today. Would you like to continue to download?',
    'usageReport.table.id': 'Date',
    'usageReport.download.summary.actions': 'Summary Report',
    'usageReport.download.details.actions': 'Detailed Report',

    // maintenance notebook
    'maintenance.title': 'Maintenance',
    'maintenance.externalLink': '/maintenance',
    // grafana
    'grafana.title': 'Grafana',
    'grafana.externalLink': '/grafana/login/generic_oauth'
  }
}
