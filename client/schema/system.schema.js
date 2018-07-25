/** @jsx builder */
import builder, {Block} from 'canner-script';

export default () => (
  <object keyName="system" title="System">
    <Block title="System Settings">
      <object keyName="org">
        <string keyName="name" title="Name"/>
        <image keyName="logo" title="Logo" disabled/>
      </object>
      <string keyName="defaultUserDiskQuota" title="Default User Disk Quota"/>
    </Block>
  </object>
)