/** @jsx builder */
import builder, {Block, Default, Tabs} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';

export default () => (
  <array keyName="userFederations" title="${userFederations}"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: '${name}',
        dataIndex: 'name'
      }, {
        title: '${type}',
        dataIndex: 'type'
      }]
    }}
  >
    <Block title="${basicInformation}">
      <string keyName="type"
        title="${type}"
        ui="select"
        uiParams={{
          options: [{
            text: 'ldap',
            value: 'ldap'
          }]
        }}
      />
      <string title="${name}" keyName="name"/>
    </Block>
    <Block title="${config}">
    <object keyName="config" packageName='../src/cms-components/customize-object-options'
      uiParams={{
        selectedKey: 'type',
        options: [{
          key: 'ldap',
          renderKeys: [
            'ldap'
          ]
        }]
      }}
    >
      <Tabs keyName="ldap">
        <Default keyName="requiredSettings" title="${requiredSettings}">
          <boolean keyName="enabled" title="${enabled}"  layout="horizontal"/>
          <number keyName="priority" title="${priority}"  layout="horizontal" uiParams={{precision: 0, step: 1}}
            packageName="../src/cms-components/customize-number-precision"
          />
          <boolean keyName="importEnabled" title="${importEnabled}"  layout="horizontal"/>
          <boolean keyName="syncRegistrations" title="${syncRegistrations}"  layout="horizontal"/>
          <string keyName="vendor"
            ui="select"
            title="${vendor}"
            layout="horizontal"
            uiParams={{
              options: [{
                text: 'Active Directory',
                value: 'activeDirectory'
              }]
            }}
          />
          <string keyName="usernameLDAPAttribute" title="${usernameLDAPAttribute}"  layout="horizontal"/>
          <string keyName="rdnLDAPAttribute" title="${rdnLDAPAttribute}"  layout="horizontal"/>
          <string keyName="uuidLDAPAttribute" title="${uuidLDAPAttribute}"  layout="horizontal"/>
          <string keyName="userObjectClasses" title="${userObjectClasses}"  layout="horizontal"/>
          <string keyName="connectionUrl" title="${connectionUrl}"  layout="horizontal"/>
          <string keyName="usersDn" title="${usersDn}"  layout="horizontal"/>
          <string keyName="authType"
            ui="select"
            title="${authType}"
            uiParams={{
              options: [{
                text: 'simple',
                value: 'simple'
              }]
            }}
            layout="horizontal"
          />
          <string keyName="bindDn" title="${bindDn}"  layout="horizontal"/>
          <string keyName="bindCredential" title="${bindCredential}"  layout="horizontal"/>
          <number keyName="searchScope" title="${searchScope}"  layout="horizontal" uiParams={{min: 0}}/>
          <boolean keyName="validatePasswordPolicy" title="${validatePasswordPolicy}"  layout="horizontal"/>
          <string keyName="useTruststoreSpi"
            ui="select"
            title="${useTruststoreSpi}"
            uiParams={{
              options: [{
                text: 'Only for ldaps',
                value: 'ldapsOnly'
              }]
            }}
            layout="horizontal"
          />
          <boolean keyName="connectionPooling" title="${connectionPooling}"  layout="horizontal" description="dsa"/>

          <number keyName="lastSync" title="${lastSync}"  layout="horizontal"/>
          <boolean keyName="debug" title="${debug}"  layout="horizontal"/>
          <boolean keyName="pagination" title="${pagination}"  layout="horizontal"/>
        </Default>
        <Default keyName="kerberosIntegration" title="${kerberosIntegration}">
          <boolean keyName="allowKerberosAuthentication" title="${allowKerberosAuthentication}"/>
          <boolean keyName="useKerberosForPasswordAuthentication" title="${useKerberosForPasswordAuthentication}" />
        </Default>
        <Default keyName="syncSetting" title="${syncSetting} ">
          <number keyName="batchSizeForSync" title="${batchSizeForSync}" uiParams={{min: 0}} />
          <number keyName="fullSyncPeriod" title="${fullSyncPeriod}" />
          <number keyName="changedSyncPeriod" title="${changedSyncPeriod}" />
        </Default>
        <Default keyName="cacheSettings" title="${cacheSettings}">
          <string keyName="cachePolicy"
            ui="select"
            title="${cachePolicy}"
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