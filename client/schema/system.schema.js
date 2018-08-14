/** @jsx builder */
import builder, {Block} from 'canner-script';
import {storage} from './utils';
export default () => (
  <object keyName="system" title="${system}" storage={storage} >
    <Block title="System Settings">
      <object keyName="org">
        <string keyName="name" title="${name}"/>
        <image keyName="logo" title="Logo"/>
      </object>
      <number keyName="defaultUserDiskQuota" title="Default User Disk Quota"
         uiParams={{unit: ' GB', step: 1, min: 0, precision: 1}}
         packageName="../src/cms-components/customize-number-precision"
      />
    </Block>
  </object>
)