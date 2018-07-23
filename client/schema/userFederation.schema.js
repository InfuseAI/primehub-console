/** @jsx builder */
import builder, {Block, Default, Tabs} from 'canner-script';

export default () => (
  <array keyName="userFederations" title="User Federations" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'Display Name',
        dataIndex: 'type'
      }]
    }}
  >
    <Block title="Console Display Name">
      <string keyNmae="type"
        ui="select"
        uiParams={{
          options: [{
            text: 'ldap',
            value: 'ldap'
          }]
        }}
      />
    </Block>
    <Block title="Config">
      <object keyName="config">
        <Tabs>
        <Default keyName="requiredSettings" title="Required Settings">
          <boolean keyName="enabled" title="Enabled"  layout="horizontal"/>
          <number keyName="priority" title="Priority"  layout="horizontal"/>
          <boolean keyName="importEnabled" title="Import Users"  layout="horizontal"/>
          <boolean keyName="syncRegistrations" title="Sync Registrations"  layout="horizontal"/>
          <string keyName="vendor" title="Vendor"
            layout="horizontal"
            ui="select"
            uiParams={{
              options: [{
                text: 'Active Directory',
                value: 'activeDirectory'
              }]
            }}
          />
          <string keyName="usernameLDAPAttribute" title="Username LDAP attribute"  layout="horizontal"/>
          <string keyName="rdnLDAPAttribute" title="RDN LDAP attribute"  layout="horizontal"/>
          <string keyName="uuidLDAPAttribute" title="UUID LDAP attribute"  layout="horizontal"/>
          <string keyName="userObjectClasses" title="User Object Classes"  layout="horizontal"/>
          <string keyName="connectionUrl" title="Connection URL"  layout="horizontal"/>
          <string keyName="usersDn" title="Users DN"  layout="horizontal"/>
          <string keyName="authType" title="Authentication Type"
            ui="select"
            uiParams={{
              options: [{
                text: 'simple',
                value: 'simple'
              }]
            }}
            layout="horizontal"
          />
          <string keyName="bindDn" title="Bind DN"  layout="horizontal"/>
          <string keyName="bindCredential" title="Bind Credential"  layout="horizontal"/>
          <number keyName="searchScope" title="Search Scope"  layout="horizontal"/>
          <boolean keyName="validatePasswordPolicy" title="Validate Password Policy"  layout="horizontal"/>
          <string keyName="useTruststoreSpi" title="Use Truststore SPI"
            ui="select"
            uiParams={{
              options: [{
                text: 'Only for ldaps',
                value: 'ldapsOnly'
              }]
            }}
            layout="horizontal"
          />
          <boolean keyName="connectionPooling" title="Connection Pooling"  layout="horizontal" description="dsa"/>

          <number keyName="lastSync" title="LastSync"  layout="horizontal"/>
          <boolean keyName="debug" title="Debug"  layout="horizontal"/>
          <boolean keyName="pagination" title="Pagination"  layout="horizontal"/>
        </Default>
        <Default keyName="kerberosIntegration" title="Kerberos Integration">
          <boolean keyName="allowKerberosAuthentication" title="Allow Kerberos Authentication"/>
          <boolean keyName="useKerberosForPasswordAuthentication" title="Use Kerberos For Password Authentication" />
        </Default>
        <Default keyName="syncSetting" title="Sync Settings">
          <number keyName="batchSizeForSync" title="Batch Size" />
          <number keyName="fullSyncPeriod" title="Periodic Full Sync" />
          <number keyName="changedSyncPeriod" title="Periodic Changed Users Sync" />
        </Default>
        <Default keyName="cacheSettings" title="Cachce Settings">
          <string keyName="cachePolicy" title="CachePolicy"
            ui="select"
            uiParams={{
              options: [{
                text: 'DEFAULT',
                value: 'DEFAULT'
              }]
            }}
          />
        </Default>
        </Tabs>
      </object>
    </Block>
  </array>
)