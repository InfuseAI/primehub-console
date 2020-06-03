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
import Workspaces from 'schema/workspace.schema';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {createFakeData} from 'canner-helpers';
import {dict, graphqlClient, imageStorage} from 'schema/utils';
import CommonBody from '../../src/cms-layouts/commonBody';
import UserBody from '../../src/cms-layouts/userBody';

const schema = (
  <root imageStorage={imageStorage} dict={dict}>
    <System/>
    <Body component={CommonBody}>
      {/* <Idp/> */}
      {/* <UserFederation/> */}
      <Workspaces />
    </Body>
    <Body component={UserBody}>
      <User/>
    </Body>
    <Body component={CommonBody}>
      <Group/>
      <InstanceType/>
    </Body>
    <Body component={CommonBody}>
      <Secret />
    </Body>
    {/* <Announcement /> */}
  </root>
)
if (process.env.NODE_ENV === 'production') {
  schema.graphqlClient = graphqlClient;
} else {
  const fakeData = createFakeData(schema.schema, 12);
  fakeData.workspace[0].id = 'default';
  fakeData.workspace[0].displayName = 'Default';
  schema.connector = new LocalStorageConnector({
    defaultData: fakeData,
    localStorageKey: 'infuse'
  })
}

export default schema
