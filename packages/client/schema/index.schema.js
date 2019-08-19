/** @jsx builder */
import builder from 'canner-script';
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
import {LocalStorageConnector} from 'canner-graphql-interface';
import {createFakeData} from 'canner-helpers';
import {dict, graphqlClient, imageStorage} from './utils';

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
    <Dataset/>
    <Secret />
    {/* <Announcement /> */}
  </root>
)
if (process.env.NODE_ENV === 'production') {
  schema.graphqlClient = graphqlClient;
} else {
  schema.connector = new LocalStorageConnector({
    defaultData: createFakeData(schema.schema, 10),
    localStorageKey: 'infuse'
  })
}

export default schema
