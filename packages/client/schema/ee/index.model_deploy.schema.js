/** @jsx builder */
import builder, {Body} from 'canner-script';
import Group from 'schema/group.schema';
import InstanceType from 'schema/instanceType.schema';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {createFakeData} from 'canner-helpers';
import {dict, graphqlClient, imageStorage} from 'schema/utils';
import CommonBody from 'cms-layouts/commonBody';
import UserBody from 'cms-layouts/userBody';

const grafana = (
  (typeof enableGrafana !== 'undefined' && enableGrafana) ?
    <object keyName="grafana"></object> :
    {}
);

const schema = (
  <root imageStorage={imageStorage} dict={dict}>
    <Body component={CommonBody}>
      {/* <Idp/> */}
      {/* <UserFederation/> */}
      <Group/>
    </Body>
    <Body component={CommonBody}>
      <InstanceType/>
    </Body>
    {grafana}
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
