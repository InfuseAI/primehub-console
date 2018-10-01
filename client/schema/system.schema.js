/** @jsx builder */
import builder, {Block, Condition} from 'canner-script';
import {storage} from './utils';

const emailValidator = (value, cb) => {
  if (value && !value.match(/(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
    return cb('should match format "email"');
  }
};

export default () => (
  <object keyName="system" title="${system}" storage={storage} >
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

    <Block title="${smtpSettings}">
      <object keyName="smtp">
        <string keyName="host" title="${smtp.host}"/>
        <number keyName="port" title="${smtp.port}"
          uiParams={{defaultValue: 25}}
          packageName="../src/cms-components/customize-number-precision"
        />
        <string keyName="fromDisplayName" title="${smtp.fromDisplayName}"/>
        <string keyName="from" title="${smtp.from}"
          validation={{
            validator: emailValidator
          }}
        />
        <string keyName="replyToDisplayName" title="${smtp.replyToDisplayName}"/>
        <string keyName="replyTo" title="${smtp.replyTo}"
          validation={{
            validator: emailValidator
          }}
        />
        <string keyName="envelopeFrom" title="${smtp.envelopeFrom}"
          validation={{
            validator: emailValidator
          }}
        />
        <boolean keyName="enableSSL" title="${smtp.enableSSL}"/>
        <boolean keyName="enableStartTLS" title="${smtp.enableStartTLS}"/>
        <boolean keyName="enableAuth" title="${smtp.enableAuth}"/>
        <Condition match={data => data.enableAuth}>
          <string keyName="username" title="${smtp.auth.username}"/>
          <string keyName="password" title="${smtp.auth.password}"/>
        </Condition>
      </object>
    </Block>
  </object>
)
