import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {withRouter} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import JobList from 'components/images/list';
import {errorHandler} from 'ee/components/job/errorHandler';
import {Group} from 'ee/components/shared/groupFilter';
import {appPrefix} from 'utils/env';
import { withGroupContext, GroupContextComponentProps } from 'context/group';

export const PhJobFragment = gql`
  fragment PhJobInfo on PhJob {
    id
    displayName
    cancel
    command
    groupId
    groupName
    schedule
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
    phase
    reason
    message
    createTime
    startTime
    finishTime
    logEndpoint
 }
`

export const GET_PH_JOB_CONNECTION = gql`
  query phJobsConnection($where: PhJobWhereInput, $page: Int, $orderBy: PhJobOrderByInput) {
    phJobsConnection(where: $where, page: $page, orderBy: $orderBy) {
      pageInfo {
        totalPage
        currentPage
      }
      edges {
        cursor
        node {
          ...PhJobInfo
        }
      }
    }
  }
  ${PhJobFragment}
`;

export const RERUN_JOB = gql`
  mutation rerunPhJob($where: PhJobWhereUniqueInput!) {
    rerunPhJob(where: $where) {
      ...PhJobInfo
    }
  }
  ${PhJobFragment}
`;

export const CANCEL_JOB = gql`
  mutation cancelPhJob($where: PhJobWhereUniqueInput!) {
    cancelPhJob(where: $where) {
      id
    }
  }
`;

type Props = {
  getPhJobConnection?: any;
  groups: Array<Group>;
  rerunPhJob: any;
  cancelPhJob: any;
  rerunPhJobResult: any;
  cancelPhJobResult: any;
} & RouteComponentProps & GroupContextComponentProps;

class JobListContainer extends React.Component<Props> {
  jobsRefetch = (payload) => {
    const payloadWithStringWhere = {...payload};
    if (payloadWithStringWhere.where)
      payloadWithStringWhere.where = JSON.stringify(payload.where);
    if (payloadWithStringWhere.orderBy)
      payloadWithStringWhere.orderBy = JSON.stringify(payload.orderBy || {});

    const {history, getPhJobConnection} = this.props;
    const search = queryString.stringify(payloadWithStringWhere);
    if (history.location.search === `?${search}`) {
      getPhJobConnection.refetch(payload);
    } else {
      history.replace({
        pathname: `job`,
        search
      });
    }
  }

  render() {
    const {groupContext, getPhJobConnection, rerunPhJob, rerunPhJobResult,cancelPhJobResult, cancelPhJob, groups } = this.props;
    return (
      <JobList
        groupContext={groupContext}
        jobsLoading={getPhJobConnection.loading}
        jobsError={getPhJobConnection.error}
        jobsConnection={getPhJobConnection.phJobsConnection || {pageInfo: {}, edges: []}}
        jobsVariables={getPhJobConnection.variables}
        jobsRefetch={this.jobsRefetch}
        rerunPhJob={rerunPhJob}
        rerunPhJobResult={rerunPhJobResult}
        cancelPhJobResult={cancelPhJobResult}
        cancelPhJob={cancelPhJob}
        groups={groups}
      />
    );
  }
}

export default compose(
  withRouter,
  graphql(GET_PH_JOB_CONNECTION, {
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
          page: Number(params.page || 1),
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getPhJobConnection'
  }),
  graphql(RERUN_JOB, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_JOB_CONNECTION,
        variables: props.getPhJobConnection.variables,
      }],
      onError: errorHandler
    }),
    name: 'rerunPhJob'
  }),
  graphql(CANCEL_JOB, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_JOB_CONNECTION,
        variables: props.getPhJobConnection.variables
      }],
      onError: errorHandler
    }),
    name: 'cancelPhJob'
  })
)(JobListContainer)
