/** @jsx builder */
import builder, {Block, Default} from 'canner-script';

export default () => (
  <array keyName="userFederations" title="User Federations" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'Display Name',
        dataIndex: 'type'
      }]
    }}
  >
    <string keyNmae="type" title="Console Display Name"
      ui="select"
      uiParams={{
        options: [{
          text: 'ldap',
          value: 'ldap'
        }]
      }}
    />
    <Default>
      <object keyName="config">
        <Block keyName="requiredSettings" title="Required Settings">
          <boolean keyName="enabled" title="Enabled" />
          <number keyName="priority" title="Priority" />
          <boolean keyName="importEnabled" title="Import Users" />
          <boolean keyName="syncRegistrations" title="Sync Registrations" />
          <string keyName="vendor" title="Vendor"
            ui="select"
            uiParams={{
              options: [{
                text: 'Active Directory',
                value: 'activeDirectory'
              }]
            }}
          />
          <string keyName="usernameLDAPAttribute" title="Username LDAP attribute" />
          <string keyName="rdnLDAPAttribute" title="RDN LDAP attribute" />
          <string keyName="uuidLDAPAttribute" title="UUID LDAP attribute" />
          <string keyName="userObjectClasses" title="User Object Classes" />
          <string keyName="connectionUrl" title="Connection URL" />
          <string keyName="usersDn" title="Users DN" />
          <string keyName="authType" title="Authentication Type"
            ui="select"
            uiParams={{
              options: [{
                text: 'simple',
                value: 'simple'
              }]
            }}
          />
          <string keyName="bindDn" title="Bind DN" />
          <string keyName="bindCredential" title="Bind Credential" />
          <number keyName="searchScope" title="Search Scope" />
          <boolean keyName="validatePasswordPolicy" title="Validate Password Policy" />
          <string keyName="useTruststoreSpi" title="Use Truststore SPI"
            ui="select"
            uiParams={{
              options: [{
                text: 'Only for ldaps',
                value: 'ldapsOnly'
              }]
            }}
          />
          <boolean keyName="connectionPooling" title="Connection Pooling" />

          <number keyName="lastSync" title="LastSync" />
          <boolean keyName="debug" title="Debug" />
          <boolean keyName="pagination" title="Pagination" />
        </Block>
        <Block keyName="kerberosIntegration" title="Kerberos Integration">
          <boolean keyName="allowKerberosAuthentication" title="Allow Kerberos Authentication" />
          <boolean keyName="useKerberosForPasswordAuthentication" title="Use Kerberos For Password Authentication" />
        </Block>
        <Block keyName="syncSetting" title="Sync Settings">
          <number keyName="batchSizeForSync" title="Batch Size" />
          <number keyName="fullSyncPeriod" title="Periodic Full Sync" />
          <number keyName="changedSyncPeriod" title="Periodic Changed Users Sync" />
        </Block>
        <Block keyName="cacheSettings" title="Cachce Settings">
          <string keyName="cachePolicy" title="CachePolicy"
            ui="select"
            uiParams={{
              options: [{
                text: 'DEFAULT',
                value: 'DEFAULT'
              }]
            }}
          />
        </Block>
      </object>
    </Default>
  </array>
)