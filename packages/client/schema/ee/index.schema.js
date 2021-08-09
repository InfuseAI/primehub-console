/** @jsx builder */
import builder, {Body} from 'canner-script';
import Group from 'schema/group.schema';
import Image from 'schema/image.schema';
import Jupyterhub from 'schema/jupyterhub.schema';
import BuildImage from 'schema/ee/buildImage.schema';
import BuildImageJob from 'schema/ee/buildImageJob.schema';
import { LocalStorageConnector } from 'canner-graphql-interface';
import { createFakeData } from 'canner-helpers';
import { dict, graphqlClient, imageStorage } from 'schema/utils';
import BuildImageJobBody from 'cms-layouts/buildImageJobBody';
import CommonBody from 'cms-layouts/commonBody';
import UserBody from 'cms-layouts/userBody';
import JupyterhubBody from 'cms-layouts/jupyterhubBody';

const maintenance =
  typeof enableMaintenanceNotebook !== 'undefined' &&
  enableMaintenanceNotebook ? (
    <object keyName="maintenance"></object>
  ) : (
    {}
  );
const grafana =
  typeof enableGrafana !== 'undefined' && enableGrafana ? (
    <object keyName="grafana"></object>
  ) : (
    {}
  );

const schema = (
  <root imageStorage={imageStorage} dict={dict}>
    <Body component={CommonBody}>
      {/* <Idp/> */}
      {/* <UserFederation/> */}
      <Group />
    </Body>
    <Body component={CommonBody}>
      <Image />
      <BuildImage />
    </Body>
    <Body component={BuildImageJobBody}>
      <BuildImageJob />
    </Body>
    <Body component={JupyterhubBody}>
      <Jupyterhub />
    </Body>

    {maintenance}
    {grafana}
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
