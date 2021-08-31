/** @jsx builder */
import builder from 'canner-script';
import { LocalStorageConnector } from 'canner-graphql-interface';
import { createFakeData } from 'canner-helpers';
import { dict, graphqlClient, imageStorage } from 'schema/utils';

const grafana =
  typeof enableGrafana !== 'undefined' && enableGrafana ? (
    <object keyName='grafana'></object>
  ) : (
    {}
  );

const schema = (
  <root imageStorage={imageStorage} dict={dict}>
    {grafana}
  </root>
);
if (process.env.NODE_ENV === 'production') {
  schema.graphqlClient = graphqlClient;
} else {
  const fakeData = createFakeData(schema.schema, 12);
  schema.connector = new LocalStorageConnector({
    defaultData: fakeData,
    localStorageKey: 'infuse',
  });
}

export default schema;
