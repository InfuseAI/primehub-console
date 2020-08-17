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
import Jupyterhub from 'schema/jupyterhub.schema';
import BuildImage from 'schema/ee/buildImage.schema';
import BuildImageJob from 'schema/ee/buildImageJob.schema';
import UsageReport from 'schema/ee/usageReport.schema';
import {LocalStorageConnector} from 'canner-graphql-interface';
import {createFakeData} from 'canner-helpers';
import {dict, graphqlClient, imageStorage} from 'schema/utils';
import BuildImageJobBody from 'cms-layouts/buildImageJobBody';
import DatasetBody from 'cms-layouts/datasetBody';
import CommonBody from 'cms-layouts/commonBody';
import UserBody from 'cms-layouts/userBody';
import JupyterhubBody from 'cms-layouts/jupyterhubBody';
import UsageReportBody from 'cms-layouts/usageReportBody';
import {isArray} from 'lodash';

const maintenance = (
  (typeof enableMaintenanceNotebook !== 'undefined' && enableMaintenanceNotebook) ?
    <object keyName="maintenance"></object> :
    {}
);
const grafana = (
  (typeof enableGrafana !== 'undefined' && enableGrafana) ?
    <object keyName="grafana"></object> :
    {}
);
const usageReport = (
  (typeof enableUsageReport !== 'undefined' && enableUsageReport) ? 
    <Body component={UsageReportBody}>
      <UsageReport />
    </Body> : 
    {}
);

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
    <Body component={JupyterhubBody}>
      <Jupyterhub />
    </Body>
    {usageReport}
    <System/>
    {maintenance}
    {grafana}
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
