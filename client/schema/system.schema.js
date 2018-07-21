/** @jsx builder */
import builder from 'canner-script';

export default () => (
  <object keyName="system" title="System">
    <object keyName="org" title="Org">
      <string keyName="name" title="Name"/>
      <string keyName="logo" title="Logo"/>
    </object>
    <number keyName="defaultUserDiskQuota" title="Default User Disk Quota"/>
  </object>
)