/** @jsx builder */
import builder, {Block} from 'canner-script';
export default () => (
  <object keyName="system" title="${system}" >
    <Block title="${systemSettings}">
      <object keyName="org">
        <string keyName="name" title="${name}"/>
        <image keyName="logo" title="${logo}"/>
      </object>
      <number keyName="defaultUserDiskQuota" title="${defaultUserDiskQuota}"
         uiParams={{unit: ' GB', step: 1, min: 1, precision: 0, defaultValue: 1}}
         validation={{min: 1}}
         packageName="../src/cms-components/customize-number-precision"
      />
    </Block>
  </object>
)