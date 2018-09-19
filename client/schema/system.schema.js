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

    <Block title="${emailSettings}">
      <object keyName="email">
        <string keyName="host" title="${email.host}"/>
        <number keyName="port" title="${email.port}"/>
        <string keyName="fromDisplayName" title="${email.fromDisplayName}"/>
        <string keyName="from" title="${email.from}"
          validation={{
            validator: emailValidator
          }}
        />
        <string keyName="replyToDisplayName" title="${email.replyToDisplayName}"/>
        <string keyName="replyTo" title="${email.replyTo}"
          validation={{
            validator: emailValidator
          }}
        />
        <string keyName="envelopeFrom" title="${email.envelopeFrom}"
          validation={{
            validator: emailValidator
          }}
        />
        <boolean keyName="enableSSL" title="${email.enableSSL}"/>
        <boolean keyName="enableStartTLS" title="${email.enableStartTLS}"/>
        <boolean keyName="enableAuth" title="${email.enableAuth}"/>
        <Condition match={data => data.enableAuth}>
          <string keyName="username" title="${email.auth.username}"/>
          <string keyName="password" title="${email.auth.password}"/>
        </Condition>
      </object>
    </Block>
  </object>
)
