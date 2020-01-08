/** @jsx builder */
import builder, {Body} from 'canner-script';
import System from './system.schema';
import Idp from './idp/identityProvider.schema';
import UserFederation from './userFederation.schema';
import User from './user.schema';
import Group from './group.schema';
import InstanceType from './instanceType.schema';
import Image from './image.schema';
import Dataset from './dataset.schema';
import Announcement from './announcement.schema';
import Secret from './secret.schema';
import Workspaces from './workspace.schema';
import BuildImage from './buildImage.schema';
import BuildImageJob from './buildImageJob.schema';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {createFakeData} from 'canner-helpers';
import {dict, graphqlClient, imageStorage} from './utils';
import BuildImageJobBody from '../src/cms-layouts/buildImageJobBody';

const schema = (
  <root imageStorage={imageStorage} dict={dict}>
    <System/>
    {/* <Idp/> */}
    {/* <UserFederation/> */}
    <Workspaces />
    <User/>
    <Group/>
    <InstanceType/>
    <Image/>
    <BuildImage />
    <Body component={BuildImageJobBody}>
      <BuildImageJob />
    </Body>
    <Dataset/>
    <Secret />
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
