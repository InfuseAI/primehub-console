import * as React from 'react';
import {Modal} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import {withRouter, Link} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import ScheduleList from 'components/schedule/list';
import {errorHandler} from 'components/job/errorHandler';
import {Group} from 'components/job/groupFilter';
import withPath, { PathComponentProps } from 'components/job/withPath';
import {appPrefix} from 'utils/env';

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
  query phSchedulesConnection($where: PhScheduleWhereInput, $first: Int, $after: String, $last: Int, $before: String) {
    phSchedulesConnection(where: $where, first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
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
} & RouteComponentProps & PathComponentProps;

class ScheduleListContainer extends React.Component<Props> {
  changeFilter = (payload) => {
    const {pathname} = this.props;
    const payloadWithStringWhere = {...payload};
    if (payloadWithStringWhere.where)
      payloadWithStringWhere.where = JSON.stringify(payload.where);

    const {history, getPhScheduleConnection} = this.props;
    const search = queryString.stringify(payloadWithStringWhere);
    if (history.location.search === `?${search}`) {
      getPhScheduleConnection.refetch(payload);
    } else {
      history.replace({
        pathname: `${appPrefix}${pathname}`,
        search
      });
    }
  }

  render() {
    const {getPhScheduleConnection, runPhSchedule, runPhScheduleResult,deletePhScheduleResult, deletePhSchedule, groups, pathname} = this.props;
    return (
      <ScheduleList
        schedulesLoading={getPhScheduleConnection.loading}
        schedulesError={getPhScheduleConnection.error}
        schedulesConnection={getPhScheduleConnection.phSchedulesConnection || {pageInfo: {}, edges: []}}
        schedulesVariables={getPhScheduleConnection.variables}
        schedulesRefetch={this.changeFilter}
        runPhSchedule={runPhSchedule}
        runPhScheduleResult={runPhScheduleResult}
        deletePhScheduleResult={deletePhScheduleResult}
        deletePhSchedule={deletePhSchedule}
        groups={groups}
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
      return {
        variables: {
          where: JSON.parse(params.where as string || '{}'),
          after: params.after || undefined,
          before: params.before || undefined,
          first: params.first ? parseInt(params.first as string, 10) : undefined,
          last: params.last ? parseInt(params.last as string, 10) : undefined
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
                props.history.push(`${appPrefix}job/${jobId}`)
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
