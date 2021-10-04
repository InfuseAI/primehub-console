import * as React from 'react';
import moment from 'moment';
import { groupBy } from 'lodash';
import { Tag, Typography, Tooltip, Layout } from 'antd';
import { Link } from 'react-router-dom';
import { PhJobsConnection } from 'queries/PhJob.graphql';
import { PhDeploymentsConnection } from 'queries/PhDeployment.graphql';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import styled from 'styled-components';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import type { Phase } from 'ee/components/job/phase';

const { Title, Text } = Typography;

export const ThinTitle = styled(Title)`
  font-weight: 200 !important;
`;

const TaskName = styled.div`
  max-width: calc(100% - 80px);
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const GuideList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  padding-left: 1rem;

  & > li {
    width: 100%;
    list-style: none;
    margin-top: 1rem;
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

const JOB_PHASE_COLOR: Partial<Record<Phase, string>> = {
  Running: 'blue',
  Succeeded: 'green',
  Failed: 'red',
  Cancelled: 'gold',
  Preparing: 'geekblue',
  Pending: '',
  Unknown: '',
};

class RecentTasks extends React.Component<Props> {
  getRecentPhJobs() {
    const { getPhJobsConnection } = this.props;
    const phJobsConnection = getPhJobsConnection.phJobsConnection;
    return phJobsConnection ? phJobsConnection.edges.slice(0, 2) : [];
  }

  getRecentPhDeployments() {
    const { getPhDeploymentsConnection } = this.props;
    const phDeploymentsConnection =
      getPhDeploymentsConnection.phDeploymentsConnection;
    return phDeploymentsConnection
      ? phDeploymentsConnection.edges.slice(0, 2)
      : [];
  }

  render() {
    // @ts-ignore
    const recentPhJobs = modelDeploymentOnly ? [] : this.getRecentPhJobs();
    const recentPhDeployments = this.getRecentPhDeployments();

    const recentTasks = recentPhJobs
      .map(j => {
        return {
          type: 'Job',
          id: j.node.id,
          link: `job/${j.node.id}`,
          name: j.node.displayName,
          status: j.node.phase,
          time: moment(j.node.createTime),
          statusColor: JOB_PHASE_COLOR[j.node.phase],
        };
      })
      .concat(
        recentPhDeployments.map(d => {
          return {
            type: 'Deployment',
            name: d.node.name,
            id: d.node.id,
            link: `deployments/${d.node.id}`,
            status: d.node.status,
            statusColor: d.node.status === 'Deployed' ? 'green' : 'red',
            time: moment(d.node.lastUpdatedTime),
          };
        })
      )
      .sort((item, next) => (item.time.isAfter(next.time) ? -1 : 1));

    const groupedTasks = groupBy(recentTasks, t =>
      t.time.clone().startOf('minute').fromNow()
    );
    return (
      <>
        <ThinTitle level={2}>Recent</ThinTitle>
        <SubContent>
          {Object.keys(groupedTasks).map((k, i) => {
            return (
              <div key={i}>
                <ThinTitle
                  level={3}
                  style={{ marginTop: i > 0 ? '0.5em' : '' }}
                >
                  {k}
                </ThinTitle>
                <GuideList>
                  {groupedTasks[k].map(t => {
                    return (
                      <li key={t.name}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Tooltip placement='top' title={t.name}>
                            <TaskName>
                              <Link to={t.link}>
                                <span style={{ marginRight: '4px' }}>
                                  [{t.type}]
                                </span>
                                {t.name}
                              </Link>
                            </TaskName>
                          </Tooltip>
                          <Tag color={t.statusColor}>{t.status}</Tag>
                        </div>

                        <Text type='secondary'>
                          {t.time.isValid()
                            ? t.time.format('YYYY-MM-DD HH:mm:ss')
                            : ''}
                        </Text>
                      </li>
                    );
                  })}
                </GuideList>
              </div>
            );
          })}
        </SubContent>
      </>
    );
  }
}

export default compose(
  withGroupContext,
  graphql(PhJobsConnection, {
    options: (props: Props) => {
      const { groupContext } = props;
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
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getPhJobsConnection',
    alias: 'withGetPhJobsConnection',
  }),
  graphql(PhDeploymentsConnection, {
    options: (props: Props) => {
      const { groupContext } = props;
      const where = {} as any;
      if (groupContext) {
        where.groupId_in = [groupContext.id];
      }

      return {
        variables: {
          where,
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getPhDeploymentsConnection',
    alias: 'withGetPhDeploymentsConnection',
  })
)(RecentTasks);
