import React from 'react';
import moment from 'moment';
import {groupBy} from 'lodash';
import {Tag, Divider, Typography, Layout, Row, Col, Card, notification, Button} from 'antd';
import {Link} from 'react-router-dom';
import {PhJobsConnection} from 'queries/PhJob.graphql';
import {PhDeploymentsConnection} from 'queries/PhDeployment.graphql';
import {withGroupContext, GroupContextComponentProps} from 'context/group';
import styled from 'styled-components';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
const {Fragment} = React;

const {Title, Text} = Typography;

export const ThinTitle = styled(Title)`
  font-weight: 200 !important;
`;

export const GuideList = styled.li`
  list-style: none;
  padding-left: 1em;
  > li {
    margin-top: 1em;
  }
`;

export const SubContent = styled.div`
  margin-bottom: 2em;
  font-size: 15px;
`;

const PAGE_PADDING = 64;
const HEADER_HEIGHT = 64;

export const Content = styled(Layout.Content)`
  margin: ${HEADER_HEIGHT + 24}px ${PAGE_PADDING}px;
  padding: 24;
  min-height: calc(100vh - 64px);
`;

type Props = {
  getPhJobsConnection: any;
  getPhDeploymentsConnection: any;
} & GroupContextComponentProps;

class RecentTasks extends React.Component<Props> {
  getRecentPhJobs() {
    const {getPhJobsConnection} = this.props;
    const phJobsConnection = getPhJobsConnection.phJobsConnection;
    return phJobsConnection ? phJobsConnection.edges.slice(0, 2) : [];
  }

  getRecentPhDeployments() {
    const {getPhDeploymentsConnection} = this.props;
    const phDeploymentsConnection = getPhDeploymentsConnection.phDeploymentsConnection;
    return phDeploymentsConnection ? phDeploymentsConnection.edges.slice(0, 2) : [];
  }

  render() {
    // @ts-ignore
    const recentPhJobs = modelDeploymentOnly ? [] : this.getRecentPhJobs();
    const recentPhDeployments = this.getRecentPhDeployments();

    const recentTasks = recentPhJobs.map(j => {
      return {
        type: 'Job',
        id: j.node.id,
        link: `job/${j.node.id}`,
        name: j.node.displayName,
        status: j.node.phase,
        time: moment(j.node.createTime),
        statusColor: j.node.phase === 'Succeeded' ? 'green' : 'red'
      };
    }).concat(recentPhDeployments.map(d => {
      return {
        type: 'Deployment',
        name: d.node.name,
        id: d.node.id,
        link: `deployments/${d.node.id}`,
        status: d.node.status,
        statusColor: d.node.status === 'Deployed' ? 'green' : 'red',
        time: moment(d.node.lastUpdatedTime)
      };
    })).sort((item, next) => item.time.isAfter(next.time) ? -1 : 1);

    const groupedTasks = groupBy(recentTasks, t => t.time.clone().startOf('minute').fromNow());
    return (
      <Fragment>
        <ThinTitle level={2}>Recent</ThinTitle>
        <SubContent>
          {Object.keys(groupedTasks).map((k, i) => {
            return (<React.Fragment>
              <ThinTitle level={3} style={{marginTop: i > 0 ? '0.5em' : ''}}>{k}</ThinTitle>
              <GuideList>
                {groupedTasks[k].map(t => {
                  return (
                    <li>
                      <Link to={t.link}>[{t.type}] {t.name}</Link> <Tag color={t.statusColor}>{t.status}</Tag>
                      <br/>
                      <Text type='secondary'>{t.time.isValid() ? t.time.format('YYYY-MM-DD HH:mm:ss') : ''}</Text>
                    </li>
                  );
                })}
              </GuideList>
            </React.Fragment>);
          })}
        </SubContent>
      </Fragment>
    );
  }
}

export default compose(
  withGroupContext,
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
  graphql(PhDeploymentsConnection, {
  options: (props: Props) => {
    const {groupContext} = props;
    const where = {} as any;
    if (groupContext) {
      where.groupId_in = [groupContext.id];
    }

    return {
      variables: {
        where,
      },
      fetchPolicy: 'cache-and-network'
    };
  },
  name: 'getPhDeploymentsConnection',
  alias: 'withGetPhDeploymentsConnection',
  }),
)(RecentTasks);
