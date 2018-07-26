/** @jsx builder */
import builder, {Block} from 'canner-script';
import {storage} from './utils';
export default () => (
  <object keyName="system" title="System" storage={storage} >
    <Block title="System Settings">
      <object keyName="org">
        <string keyName="name" title="Name"/>
        <image keyName="logo" title="Logo"/>
      </object>
      <string keyName="defaultUserDiskQuota" title="Default User Disk Quota"/>
    </Block>
  </object>
)