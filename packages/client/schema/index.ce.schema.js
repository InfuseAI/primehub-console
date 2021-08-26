/** @jsx builder */
import builder, { Body } from 'canner-script';
import Image from './image.schema';
import Jupyterhub from 'schema/jupyterhub.schema';
import { LocalStorageConnector } from 'canner-graphql-interface';
import { createFakeData } from 'canner-helpers';
import { dict, graphqlClient, imageStorage } from './utils';
import CommonBody from 'cms-layouts/commonBody';
import UserBody from 'cms-layouts/userBody';
import JupyterhubBody from 'cms-layouts/jupyterhubBody';

const schema = (
  <root imageStorage={imageStorage} dict={dict}>
    <Body component={CommonBody}>
      <Image />
    </Body>
    <Body component={JupyterhubBody}>
      <Jupyterhub />
    </Body>
    {/* <Announcement /> */}
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
