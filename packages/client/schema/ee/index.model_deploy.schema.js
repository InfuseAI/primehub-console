/** @jsx builder */
import builder, {Body} from 'canner-script';
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
      <InstanceType/>
    </Body>
    {grafana}
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
