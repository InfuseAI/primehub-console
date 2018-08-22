/** @jsx builder */
import builder, {Block} from 'canner-script';
import {storage} from './utils';
export default () => (
  <object keyName="system" title="${system}" storage={storage} >
    <Block title="${systemSettings}">
      <object keyName="org">
        <string keyName="name" title="${name}"/>
        <image keyName="logo" title="${logo}"/>
      </object>
      <number keyName="defaultUserDiskQuota" title="${defaultUserDiskQuota}"
         uiParams={{unit: ' GB', step: 1, min: 0.1, precision: 1, defaultValue: 0.1}}
         validation={{min: 0.1}}
         packageName="../src/cms-components/customize-number-precision"
      />
    </Block>
  </object>
)