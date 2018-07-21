/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <array keyName="userFederations" title="User Federations" ui="tableRoute">
    <string keyNmae="type" title="Console Display Name"
      ui="select"
      uiParams={{
        options: [{
          text: 'ldap',
          value: 'ldap'
        }]
      }}
    />
    <object keyName="config" title="Config" >
      <boolean keyName="pagination" title="Pagination" />
      <number keyName="fullSyncPeriod" title="FullSyncPeriod" />
      <boolean keyName="connectionPooling" title="ConnectionPooling" />
      <string keyName="usersDn" title="UsersDn" />
      <string keyName="cachePolicy" title="CachePolicy" />
      <boolean keyName="useKerberosForPasswordAuthentication" title="UseKerberosForPasswordAuthentication" />
      <boolean keyName="importEnabled" title="ImportEnabled" />
      <boolean keyName="enabled" title="Enabled" />
      <string keyName="bindCredential" title="BindCredential" />
      <string keyName="usernameLDAPAttribute" title="UsernameLDAPAttribute" />
      <string keyName="bindDn" title="BindDn" />
      <number keyName="changedSyncPeriod" title="ChangedSyncPeriod" />
      <number keyName="lastSync" title="LastSync" />
      <string keyName="vendor" title="Vendor" />
      <string keyName="uuidLDAPAttribute" title="UuidLDAPAttribute" />
      <string keyName="connectionUrl" title="ConnectionUrl" />
      <boolean keyName="allowKerberosAuthentication" title="AllowKerberosAuthentication" />
      <boolean keyName="syncRegistrations" title="SyncRegistrations" />
      <string keyName="authType" title="AuthType" />
      <boolean keyName="debug" title="Debug" />
      <number keyName="searchScope" title="SearchScope" />
      <string keyName="useTruststoreSpi" title="UseTruststoreSpi" />
      <number keyName="priority" title="Priority" />
      <string keyName="userObjectClasses" title="UserObjectClasses" />
      <string keyName="rdnLDAPAttribute" title="RdnLDAPAttribute" />
      <boolean keyName="validatePasswordPolicy" title="ValidatePasswordPolicy" />
      <number keyName="batchSizeForSync" title="BatchSizeForSync" />
    </object>
  </array>
)