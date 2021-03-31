import * as React from 'react';
import {Tag, Divider, Typography, Layout, Row, Col, Card, notification, Button} from 'antd';
import PageTitle from 'components/pageTitle';
import styled from 'styled-components';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';
import {withGroupContext, GroupContextComponentProps} from 'context/group';
import {CurrentUser} from 'queries/User.graphql';
import {compose} from 'recompose';
import {graphql} from 'react-apollo';
import Breadcrumbs, {BreadcrumbItemSetup} from 'components/share/breadcrumb';
import {PhJobsConnection} from 'queries/PhJob.graphql';
import moment from 'moment';

const breadcrumbs: BreadcrumbItemSetup[] = [
  {
    key: 'home',
    matcher: /\/home/,
    title: 'Home',
  }
];

const {Title, Text} = Typography;

const PAGE_PADDING = 64;
const HEADER_HEIGHT = 64;

const ThinTitle = styled(Title)`
  font-weight: 200 !important;
`;

const GuideList = styled.li`
  list-style: none;
  padding-left: 1em;
  > li {
    margin-top: 1em;
  }
`;

const SubContent = styled.div`
  margin-bottom: 2em;
`;

const Content = styled(Layout.Content)`
  margin: ${HEADER_HEIGHT + 24}px ${PAGE_PADDING}px;
  padding: 24;
  min-height: calc(100vh - 64px);
`;

type Props = {
  currentUser: any;
  getPhJobsConnection: any;
} & GroupContextComponentProps;

class Landing extends React.Component<Props> {
  getRecentPhJobs() {
    const {getPhJobsConnection} = this.props;
    const phJobsConnection = getPhJobsConnection.phJobsConnection;
    return phJobsConnection ? phJobsConnection.edges.slice(0, 2) : [];
  }

  render() {
    const {groupContext, currentUser} = this.props;
    const recentPhJobs = this.getRecentPhJobs();
    const recentTasks = recentPhJobs.map(j => {
      return {
        type: "Job",
        name: j.node.displayName,
        status: j.node.phase,
        time: moment(j.node.createTime),
        statusColor: j.node.phase === "Succeeded" ? "green" : "red"
      };
    })
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
              <Divider></Divider>
              <ThinTitle level={2}>Recent</ThinTitle>
              <SubContent>
                <ThinTitle level={3}>Yesterday</ThinTitle>
                  <GuideList>
                    {recentTasks.map(t => {
                      return (
                        <li>
                          <a href=''>[{t.type}] {t.name}</a> <Tag color={t.statusColor}>{t.status}</Tag>
                          <br/>
                          <Text type="secondary">{t.time.isValid() ? t.time.format("YYYY-MM-DD HH:mm:ss") : ''}</Text>
                        </li>
                      )
                    })}
                  </GuideList>
              </SubContent>
            </Content>
          </Col>
          <Col span={8}>
            <ResourceMonitor
              style={
                { marginTop: 24, marginRight: 24 }
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
  graphql(PhJobsConnection, {
  options: (props: Props) => {
    const {groupContext} = props;
    const where = {} as any;
    if (groupContext) {
      where.groupId_in = [groupContext.id];
    }

    return {
      variables: {
        where,
        orderBy: {},
        page: 1,
      },
      fetchPolicy: 'cache-and-network'
    };
  },
  name: 'getPhJobsConnection',
  alias: 'withGetPhJobsConnection',
  }),
)(Landing);
