import * as React from 'react';
import {Tag, Divider, Typography, Layout, Row, Col, Card, notification, Button} from 'antd';
import PageTitle from 'components/pageTitle';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';
import UserResourceMonitor from 'components/share/userResourceMonitor';
import {withGroupContext, GroupContextComponentProps} from 'context/group';
import {CurrentUser} from 'queries/User.graphql';
import {compose} from 'recompose';
import {graphql} from 'react-apollo';
import Breadcrumbs, {BreadcrumbItemSetup} from 'components/share/breadcrumb';
import RecentTasks, {ThinTitle, GuideList, Content, SubContent} from 'components/landing/recentTasks';

const breadcrumbs: BreadcrumbItemSetup[] = [
  {
    key: 'home',
    matcher: /\/home/,
    title: 'Home',
  }
];

type Props = {
  currentUser: any;
} & GroupContextComponentProps;

class Landing extends React.Component<Props> {

  render() {
    const {groupContext, currentUser} = this.props;
    console.log(groupContext);

    return (
      <Layout>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Home'}
        />
        <Row>
          <Col span={16}>
            <Content style={
                {margin: 24, padding: '24px 36px', backgroundColor: '#fff'}
            }>
              <Row>
                <Col span={12}>
                  <ThinTitle level={2}>Getting Started</ThinTitle>
                  <SubContent>
                    <GuideList>
                      <li>
                        <a href={`https://docs.primehub.io/docs/quickstart/primehub?utm_source=primehub&utm_medium=ce&utm_campaign=${window.primehubVersion}`}>Learn How To use PrimeHub Platform</a>
                      </li>
                      <li>
                        <a href=''>Administration Guide</a>
                      </li>
                      <li>
                        <a href=''>Release Notes</a>
                      </li>
                    </GuideList>
                  </SubContent>
                </Col>
                <Col span={12}>
                  <ThinTitle level={2}>Open</ThinTitle>
                  <SubContent>
                    <GuideList>
                      <li>
                        <a href='hub'>Open Jupyter Notebook</a>
                      </li>
                      <li>
                        <a href='jobs'>Create New Job</a>
                      </li>
                      <li>
                        <a href='model-deployment'>Deploy Model</a>
                      </li>
                      <li>
                        <a href='apps'>Install Application</a>
                      </li>
                      <li>
                        <a href='browse'>Browse Shared Files...</a>
                      </li>
                    </GuideList>
                  </SubContent>
                </Col>
              </Row>
              {
                // @ts-ignore
                (primehubCE) ? (
                  <></>
                ) : (
                  <div>
                    <Divider></Divider>
                    <RecentTasks />
                  </div>
                )
              }
            </Content>
          </Col>
          <Col span={8}>
            {
              // @ts-ignore
              (modelDeploymentOnly) ? (
                <></>
              ) : (
              <UserResourceMonitor groupContext={groupContext} style={
                { marginTop: 24, marginRight: 24 }
              }/>
              )
            }
            <ResourceMonitor
              style={
                { marginTop: 16, marginRight: 24 }
              }
              groupContext={groupContext}
              refetchGroup={currentUser.refetch}
              selectedGroup={groupContext.id}
            />
          </Col>
        </Row>
      </Layout>
    );
  }
}

export default compose(
  withGroupContext,
  graphql(CurrentUser, {
    alias: 'withCurrentUser',
    name: 'currentUser'
  }),
)(Landing);
