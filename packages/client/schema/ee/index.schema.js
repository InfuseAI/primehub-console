/** @jsx builder */
import builder, { Body } from 'canner-script';
import Jupyterhub from 'schema/jupyterhub.schema';
import { LocalStorageConnector } from 'canner-graphql-interface';
import { createFakeData } from 'canner-helpers';
import { dict, graphqlClient, imageStorage } from 'schema/utils';
import JupyterhubBody from 'cms-layouts/jupyterhubBody';

const schema = (
  <root imageStorage={imageStorage} dict={dict}>
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
