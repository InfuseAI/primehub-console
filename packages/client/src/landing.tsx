import * as React from 'react';
import { Divider, Layout, Row, Col, Card } from 'antd';
import { Link } from 'react-router-dom';
import PageTitle from 'components/pageTitle';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';
import UserResourceMonitor from 'components/share/userResourceMonitor';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import { CurrentUser, CreateInvitation } from 'queries/User.graphql';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import Breadcrumbs, { BreadcrumbItemSetup } from 'components/share/breadcrumb';
import RecentTasks, {
  ThinTitle,
  GuideList,
  Content,
  SubContent,
} from 'components/landing/recentTasks';
import ResourceDashboard from 'components/landing/resourceDashboard';
import InviteButton from 'components/InviteButton';
import { errorHandler } from 'utils/errorHandler';
import { GetDownloadableFiles } from "containers/sharedFiles/Dataset.graphql";
import { get } from 'lodash';
import { useRoutePrefix } from 'hooks/useRoutePrefix';

const breadcrumbs: BreadcrumbItemSetup[] = [
  {
    key: 'home',
    matcher: /\/home/,
    title: 'Home',
    tips: 'Home is the landing page of User Portal where it has a group-related dashboard.',
    tipsLink: 'https://docs-v4.primehub.io/user-guide/user-portal',
  },
];

type Props = {
  currentUser: any;
  createInvitationMutation: any;
  downloadableFiles: any;
} & GroupContextComponentProps;

function Landing({ groupContext, currentUser, downloadableFiles, ...props }: Props) {
  const { appPrefix } = useRoutePrefix();
  const fileToDownloads = get(downloadableFiles, 'downloadableFiles', []);
  const qsLink = modelDeploymentOnly
    ? 'https://docs-v4.primehub.io/user-guide/deployments'
    : 'https://docs-v4.primehub.io';

  async function onRequestInvitation(groupId: string) {
    try {
      const response = await props.createInvitationMutation({
        variables: {
          data: {
            groupId,
          },
        },
      });

      return response;
    } catch (err) {
      console.error(err);
      errorHandler(err);
    }
  }

  if (!groupContext) return <div></div>;

  return (
    <Layout>
      <PageTitle
        breadcrumb={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxHeight: 21,
            }}
          >
            <Breadcrumbs pathList={breadcrumbs} />
              <InviteButton
                groupId={groupContext.id}
                enabled={
                  window?.enableInviteUsers && currentUser.me.enableInviteUsers
                }
                onRequestToken={onRequestInvitation}
              />
          </div>
        }
        title={'Home'}
      />
      <Row>
        <Col span={16}>
          <Content
            style={{
              margin: 24,
              padding: '24px 36px',
              backgroundColor: '#fff',
            }}
          >
            <Row>
              <Col span={12}>
                <ThinTitle level={2}>User Guide</ThinTitle>
                <SubContent>
                  <GuideList>
                    <li>
                      <a href={qsLink} target='_blank' rel='noreferrer'>
                        PrimeHub Platform Introduction
                      </a>
                    </li>
                    <li>
                      <a
                        href='https://docs-v4.primehub.io/user-guide/user-portal'
                        target='_blank'
                        rel='noreferrer'
                      >
                        PrimeHub User Guide
                      </a>
                    </li>
                    <li>
                      <a
                        href='https://docs-v4.primehub.io/administrator-guide/admin-portal'
                        target='_blank'
                        rel='noreferrer'
                      >
                        PrimeHub Administrator Guide
                      </a>
                    </li>
                    <li>
                      <a
                        href='https://docs-v4.primehub.io/end-to-end-tutorial/1-mlops-introduction-and-scoping-the-project'
                        target='_blank'
                        rel='noreferrer'
                      >
                        End-to-End Tutorial
                      </a>
                    </li>
                  </GuideList>
                </SubContent>
              </Col>
              <Col span={12}>
                <ThinTitle level={2}>Quickstart</ThinTitle>
                {
                  // @ts-ignore
                  modelDeploymentOnly ? (
                    <SubContent>
                      <GuideList>
                        <li>
                          <Link to='deployments'>Deploy Model</Link>
                        </li>
                      </GuideList>
                    </SubContent>
                  ) : // @ts-ignore
                  primehubCE ? (
                    <SubContent>
                      <GuideList>
                        <li>
                          <Link to='hub'>Open Jupyter Notebook</Link>
                        </li>
                        <li>
                          <Link to='hub?path=primehub-examples/tensorflow2/tensorflow2.ipynb&instancetype=cpu-1&image=tf-2&autolaunch=1'>
                            Open TensorFlow Notebook
                          </Link>
                        </li>
                        <li>
                          <Link to='hub?path=primehub-examples/pytorch/pytorch.ipynb&instancetype=cpu-1&image=pytorch-1&autolaunch=1'>
                            Open PyTorch Notebook
                          </Link>
                        </li>
                        <li
                          style={{
                            display: window.enableApp ? 'inherit' : 'none',
                          }}
                        >
                          <Link to='apps'>Install Application</Link>
                        </li>
                        <li
                          style={{
                            display: window.enablePhfs ? 'inherit' : 'none',
                          }}
                        >
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
                          <Link to='hub?path=primehub-examples/tensorflow2/tensorflow2.ipynb&instancetype=cpu-1&image=tf-2&autolaunch=1'>
                            Open TensorFlow Notebook
                          </Link>
                        </li>
                        <li>
                          <Link to='hub?path=primehub-examples/pytorch/pytorch.ipynb&instancetype=cpu-1&image=pytorch-1&autolaunch=1'>
                            Open PyTorch Notebook
                          </Link>
                        </li>
                        <li>
                          <Link to='job'>Create New Job</Link>
                        </li>
                        <li
                          style={{
                            display: window.enableModelDeployment
                              ? 'inherit'
                              : 'none',
                          }}
                        >
                          <Link to='deployments'>Deploy Model</Link>
                        </li>
                        <li
                          style={{
                            display: window.enableApp ? 'inherit' : 'none',
                          }}
                        >
                          <Link to='apps'>Install Application</Link>
                        </li>
                        <li
                          style={{
                            display: window.enablePhfs ? 'inherit' : 'none',
                          }}
                        >
                          <Link to='browse'>Upload Shared Files...</Link>
                        </li>
                      </GuideList>
                    </SubContent>
                  )
                }
              </Col>
            </Row>
            <div>
              <Divider></Divider>
              <ResourceDashboard />
            </div>
            {
              // @ts-ignore
              primehubCE ? (
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
            modelDeploymentOnly ? (
              <></>
            ) : (
              <UserResourceMonitor
                groupContext={groupContext}
                style={{ marginTop: 24, marginRight: 24 }}
              />
            )
          }
          <ResourceMonitor
            style={{ marginTop: 16, marginRight: 24 }}
            groupContext={groupContext}
            refetchGroup={currentUser.refetch}
            selectedGroup={groupContext.id}
          />
          {fileToDownloads ? (
            <Card
              title='Downloadable zip files (from newest to oldest)'
              style={{ marginTop: 16, marginRight: 24 }}
            >
              {fileToDownloads.map(item => (
                <a href={`${appPrefix}files/tmp/${item}?download=1`}>
                  <p>{item}</p>
                </a>
              ))}
            </Card>
          ) : (
            <></>
          )}
        </Col>
      </Row>
    </Layout>
  );
}

export default compose(
  withGroupContext,
  graphql(CurrentUser, {
    alias: 'withCurrentUser',
    name: 'currentUser',
  }),
  graphql(CreateInvitation, {
    name: 'createInvitationMutation',
  }),
  graphql(GetDownloadableFiles, {
    name: 'downloadableFiles',
  })
)(Landing);
