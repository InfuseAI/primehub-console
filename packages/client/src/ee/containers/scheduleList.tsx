import * as React from 'react';
import {Modal} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import {withRouter, Link} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import ScheduleList from 'ee/components/schedule/list';
import {errorHandler} from 'ee/components/job/errorHandler';
import {Group} from 'ee/components/shared/groupFilter';
import withPath, { PathComponentProps } from '../components/job/withPath';
import {GroupContextComponentProps} from 'context/group';

export const PhScheduleFragment = gql`
  fragment PhScheduleInfo on PhSchedule {
    id
    displayName
    recurrence {
      type
      cron
    }
    invalid
    message
    displayName
    command
    groupId
    groupName
    image
    instanceType {
      id
      name
      displayName
      cpuLimit
      memoryLimit
      gpuLimit
    }
    userId
    userName
    nextRunTime
 }
`

export const GET_PH_SCHEDULE_CONNECTION = gql`
  query phSchedulesConnection($where: PhScheduleWhereInput, $page: Int, $orderBy: PhScheduleOrderByInput) {
    phSchedulesConnection(where: $where, page: $page, orderBy: $orderBy) {
      pageInfo {
        totalPage
        currentPage
      }
      edges {
        cursor
        node {
          ...PhScheduleInfo
        }
      }
    }
  }
  ${PhScheduleFragment}
`;

export const RUN_SCHEDULE = gql`
  mutation runPhSchedule($where: PhScheduleWhereUniqueInput!) {
    runPhSchedule(where: $where) {
      job {
        displayName
        id
      }
    }
  }
`;

export const DELETE_SCHEDULE = gql`
  mutation deletePhSchedule($where: PhScheduleWhereUniqueInput!) {
    deletePhSchedule(where: $where) {
      id
    }
  }
`;

type Props = {
  getPhScheduleConnection?: any;
  groups: Array<Group>;
  runPhSchedule: any;
  deletePhSchedule: any;
  runPhScheduleResult: any;
  deletePhScheduleResult: any;
} & RouteComponentProps & PathComponentProps & GroupContextComponentProps;

class ScheduleListContainer extends React.Component<Props> {
  scheduleRefetch = (payload) => {
    const {pathname} = this.props;
    const payloadWithStringWhere = {...payload};
    if (payloadWithStringWhere.where)
      payloadWithStringWhere.where = JSON.stringify(payload.where);
    if (payloadWithStringWhere.orderBy)
      payloadWithStringWhere.orderBy = JSON.stringify(payload.orderBy || {});

    const {history, getPhScheduleConnection} = this.props;
    const search = queryString.stringify(payloadWithStringWhere);
    if (history.location.search === `?${search}`) {
      getPhScheduleConnection.refetch(payload);
    } else {
      history.replace({
        pathname: `schedule`,
        search
      });
    }
  }

  render() {
    const {getPhScheduleConnection, runPhSchedule, runPhScheduleResult,deletePhScheduleResult, deletePhSchedule, groups, pathname, groupContext} = this.props;
    return (
      <ScheduleList
        schedulesLoading={getPhScheduleConnection.loading}
        schedulesError={getPhScheduleConnection.error}
        schedulesConnection={getPhScheduleConnection.phSchedulesConnection || {pageInfo: {}, edges: []}}
        schedulesVariables={getPhScheduleConnection.variables}
        schedulesRefetch={this.scheduleRefetch}
        runPhSchedule={runPhSchedule}
        runPhScheduleResult={runPhScheduleResult}
        deletePhScheduleResult={deletePhScheduleResult}
        deletePhSchedule={deletePhSchedule}
        groups={groups}
        groupContext={groupContext}
      />
    );
  }
}

export default compose(
  withRouter,
  withPath,
  graphql(GET_PH_SCHEDULE_CONNECTION, {
    options: (props: Props) => {
      const params = queryString.parse(props.location.search.replace(/^\?/, ''));
      const {groupContext} = props;
      const where = JSON.parse(params.where as string || '{}');
      if (groupContext) {
        where.groupId_in = [groupContext.id];
      }

      return {
        variables: {
          where,
          orderBy: JSON.parse(params.orderBy as string || '{}'),
          page: Number(params.page || 1)
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getPhScheduleConnection'
  }),
  graphql(RUN_SCHEDULE, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_SCHEDULE_CONNECTION,
        variables: props.getPhScheduleConnection.variables,
      }],
      onCompleted: data => {
        const jobId = get(data, 'runPhSchedule.job.id', '');
        const jobName = get(data, 'runPhSchedule.job.displayName', '');
        const modal = Modal.success({
          title: 'Success',
          content: (
            <div>
              {jobName} has been submitted! You can
              <a onClick={() => {
                props.history.push(`job/${jobId}`)
                modal.destroy();
              }}>
                {` `}
                <u>view your job details here.</u>
              </a>
            </div>
          ),
          onOk() {},
        });
      },
      onError: errorHandler
    }),
    name: 'runPhSchedule'
  }),
  graphql(DELETE_SCHEDULE, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_SCHEDULE_CONNECTION,
        variables: props.getPhScheduleConnection.variables
      }],
      onError: errorHandler
    }),
    name: 'deletePhSchedule'
  })
)(ScheduleListContainer)
