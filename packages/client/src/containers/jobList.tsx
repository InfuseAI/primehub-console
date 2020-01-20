import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {withRouter} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import JobList from 'components/job/list';
import {errorHandler} from 'components/job/errorHandler';
import {Group} from 'components/job/groupFilter';
import {FilterPayload} from 'containers/types';

export const PhJobFragement = gql`
  fragment PhJobInfo on PhJob {
    id
    displayName
    cancel
    command
    groupId
    groupName
    image
    instanceType
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
  query phJobsConnection($where: PhJobWhereInput, $first: Int, $after: String, $last: Int, $before: String) {
    phJobsConnection(where: $where, first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          ...PhJobInfo
        }
      }
    }
  }
  ${PhJobFragement}
`;

export const RERUN_JOB = gql`
  mutation rerunPhJob($where: PhJobWhereUniqueInput!) {
    rerunPhJob(where: $where) {
      ...PhJobInfo
    }
  }
  ${PhJobFragement}
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
  changeFilter: (payload: FilterPayload) => void;
} & RouteComponentProps
  & FilterPayload;

const appPrefix = (window as any).APP_PREFIX || '/';

class JobListContainer extends React.Component<Props> {
  render() {
    const {
      getPhJobConnection,
      groups,
      rerunPhJob,
      cancelPhJob,
      rerunPhJobResult,
      cancelPhJobResult,
      changeFilter,
    } = this.props;

    return (
      <JobList
        jobsLoading={getPhJobConnection.loading}
        jobsError={getPhJobConnection.error}
        jobsConnection={getPhJobConnection.phJobsConnection || {pageInfo: {}, edges: []}}
        jobsVariables={getPhJobConnection.variables}
        jobsRefetch={changeFilter}
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
      return {
        variables: {
          where: props.where,
          after: props.after,
          before: props.before,
          first: props.first,
          last: props.last,
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
      onCompleted: () => {
        props.history.push(`${appPrefix}job`);
      },
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
      onCompleted: () => {
        props.history.push(`${appPrefix}job`);
      },
      onError: errorHandler
    }),
    name: 'cancelPhJob'
  })
)(JobListContainer)
