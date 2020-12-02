/** @jsx builder */
import builder, {Body} from 'canner-script';
import System from 'schema/system.schema';
import Idp from 'schema/idp/identityProvider.schema';
import UserFederation from 'schema/userFederation.schema';
import User from 'schema/user.schema';
import Group from 'schema/group.schema';
import InstanceType from 'schema/instanceType.schema';
import Announcement from 'schema/announcement.schema';
import Secret from 'schema/secret.schema';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {createFakeData} from 'canner-helpers';
import {dict, graphqlClient, imageStorage} from 'schema/utils';
import CommonBody from 'cms-layouts/commonBody';
import UserBody from 'cms-layouts/userBody';

const schema = (
  <root imageStorage={imageStorage} dict={dict}>
    <Body component={CommonBody}>
      {/* <Idp/> */}
      {/* <UserFederation/> */}
      <Group/>
    </Body>
    <Body component={UserBody}>
      <User/>
    </Body>
    <Body component={CommonBody}>
      <InstanceType/>
      <Secret />
    </Body>
    <System/>
    {/* <Announcement /> */}
  </root>
)
if (process.env.NODE_ENV === 'production') {
  schema.graphqlClient = graphqlClient;
} else {
  const fakeData = createFakeData(schema.schema, 12);
  schema.connector = new LocalStorageConnector({
    defaultData: fakeData,
    localStorageKey: 'infuse'
  })
}

export default schema
