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
import {LocalStorageConnector} from 'canner-graphql-interface';
import {createFakeData} from 'canner-helpers';
import {dict, graphqlClient, imageStorage} from './utils';
import DatasetBody from '../src/cms-layouts/datasetBody';
import CommonBody from '../src/cms-layouts/commonBody';
import UserBody from '../src/cms-layouts/userBody';
import {isArray} from 'lodash';

const schema = (
  <root imageStorage={imageStorage} dict={dict}>
    <Body component={CommonBody}>
      {/* <Idp/> */}
      {/* <UserFederation/> */}
      <Group/>
      <Workspaces />
    </Body>
    <Body component={UserBody}>
      <User/>
    </Body>
    <Body component={CommonBody}>
      <InstanceType/>
      <Image/>
    </Body>
    <Body component={DatasetBody}>
      <Dataset/>
    </Body>
    <Body component={CommonBody}>
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
  // ensure workspaceId:default in fakeData
  fakeData.workspace[0].id = 'default';
  fakeData.workspace[0].displayName = 'Default';
  Object.keys(fakeData).forEach(key => {
    if (key === 'workspace') return;
    if (isArray(fakeData[key])) {
      fakeData[key] = fakeData[key].map(row => ({...row, workspaceId: 'default'}));
    }
  })
  schema.connector = new LocalStorageConnector({
    defaultData: fakeData,
    localStorageKey: 'infuse'
  })
}

export default schema
