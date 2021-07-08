import * as React from 'react';
import {Tag, Divider, Typography, Layout, Row, Col, Card, notification, Button} from 'antd';
import {Link} from 'react-router-dom';
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
    tips: 'Home is the landing page of User Portal where it has a group-related dashboard.',
    tipsLink: 'https://docs.primehub.io/docs/quickstart/login-portal-user'
  }
];

type Props = {
  currentUser: any;
} & GroupContextComponentProps;

class Landing extends React.Component<Props> {

  render() {
    const {groupContext, currentUser} = this.props;
    // @ts-ignore
    const qsLink = modelDeploymentOnly ? 'https://docs.primehub.io/docs/quickstart/qs-primehub-deploy' : 'https://docs.primehub.io/docs/quickstart/qs-primehub';

    if (!groupContext) return <div></div>;

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
                  <ThinTitle level={2}>User Guide</ThinTitle>
                  <SubContent>
                    <GuideList>
                      <li>
                        <a href={qsLink} target='_blank'>Learn How To Use PrimeHub Platform</a>
                      </li>
                      <li><a href='https://docs.primehub.io/docs/introduction#user-portal' target='_blank'>PrimeHub User Guide</a></li>
                      <li>
                        <a href='https://docs.primehub.io/docs/introduction#admin-portal' target='_blank'>Administration Guide</a>
                      </li>
                      <li>
                        <a href='https://docs.primehub.io/docs/release-note' target='_blank'>Release Notes</a>
                      </li>
                    </GuideList>
                  </SubContent>
                </Col>
                <Col span={12}>
                  <ThinTitle level={2}>Quickstart</ThinTitle>
                  {
                    // @ts-ignore
                    (modelDeploymentOnly) ? (
                      <SubContent>
                        <GuideList>
                          <li>
                            <Link to='deployments'>Deploy Model</Link>
                          </li>
                        </GuideList>
                      </SubContent>
                    // @ts-ignore
                    ) : primehubCE ? (
                      <SubContent>
                        <GuideList>
                          <li>
                            <Link to='hub'>Open Jupyter Notebook</Link>
                          </li>
                          <li>
                            <Link to='hub?path=primehub-examples/tensorflow2/tensorflow2.ipynb&instancetype=cpu-1&image=tf-2&autolaunch=1'>Open TensorFlow Notebook</Link>
                          </li>
                          <li>
                            <Link to='hub?path=primehub-examples/pytorch/pytorch.ipynb&instancetype=cpu-1&image=pytorch-1&autolaunch=1'>Open PyTorch Notebook</Link>
                          </li>
                          <li style={{display: (window.enableApp) ? 'inherit' : 'none'}}>
                            <Link to='apps'>Install Application</Link>
                          </li>
                          <li style={{display: (window.enablePhfs) ? 'inherit' : 'none'}}>
                            <Link to='browse'>Upload Shared Files...</Link>
                          </li>
                        </GuideList>
                      </SubContent>
                    ) : (
                      <SubContent>
                        <GuideList>
                          <li>
                            <Link to='hub'>Open Jupyter Notebook</Link>
                          </li>
                          <li>
                            <Link to='hub?path=primehub-examples/tensorflow2/tensorflow2.ipynb&instancetype=cpu-1&image=tf-2&autolaunch=1'>Open TensorFlow Notebook</Link>
                          </li>
                          <li>
                            <Link to='hub?path=primehub-examples/pytorch/pytorch.ipynb&instancetype=cpu-1&image=pytorch-1&autolaunch=1'>Open PyTorch Notebook</Link>
                          </li>
                          <li>
                            <Link to='job'>Create New Job</Link>
                          </li>
                          <li style={{display: (window.enableModelDeployment) ? 'inherit' : 'none'}}>
                            <Link to='deployments'>Deploy Model</Link>
                          </li>
                          <li style={{display: (window.enableApp) ? 'inherit' : 'none'}}>
                            <Link to='apps'>Install Application</Link>
                          </li>
                          <li style={{display: (window.enablePhfs) ? 'inherit' : 'none'}}>
                            <Link to='browse'>Upload Shared Files...</Link>
                          </li>
                        </GuideList>
                      </SubContent>
                    )
                  }
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
