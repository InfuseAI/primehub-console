/** @jsx builder */
import builder, {Body} from 'canner-script';
import System from 'schema/system.schema';
import Idp from 'schema/idp/identityProvider.schema';
import UserFederation from 'schema/userFederation.schema';
import User from 'schema/user.schema';
import Group from 'schema/group.schema';
import InstanceType from 'schema/instanceType.schema';
import Image from 'schema/image.schema';
import Dataset from 'schema/dataset.schema';
import Announcement from 'schema/announcement.schema';
import Secret from 'schema/secret.schema';
import Workspaces from 'schema/workspace.schema';
import BuildImage from 'schema/ee/buildImage.schema';
import BuildImageJob from 'schema/ee/buildImageJob.schema';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {createFakeData} from 'canner-helpers';
import {dict, graphqlClient, imageStorage} from 'schema/utils';
import BuildImageJobBody from '../../src/cms-layouts/buildImageJobBody';
import DatasetBody from '../../src/cms-layouts/datasetBody';
import CommonBody from '../../src/cms-layouts/commonBody';
import UserBody from '../../src/cms-layouts/userBody';
import {isArray} from 'lodash';

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
      <Image/>
      <BuildImage />
    </Body>
    <Body component={BuildImageJobBody}>
      <BuildImageJob />
    </Body>
    <Body component={DatasetBody}>
      <Dataset/>
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
