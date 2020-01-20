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
} & RouteComponentProps;

const appPrefix = (window as any).APP_PREFIX || '/';

class JobListContainer extends React.Component<Props> {
  changeFilter = (payload) => {
    if (payload.where)
      payload.where = JSON.stringify(payload.where);

    const {history} = this.props;
    history.push({
      pathname: `${appPrefix}job`,
      search: queryString.stringify(payload)
    });
  }

  render() {
    const {getPhJobConnection, rerunPhJob, rerunPhJobResult,cancelPhJobResult, cancelPhJob, groups } = this.props;
    return (
      <JobList
        jobsLoading={getPhJobConnection.loading}
        jobsError={getPhJobConnection.error}
        jobsConnection={getPhJobConnection.phJobsConnection || {pageInfo: {}, edges: []}}
        jobsVariables={getPhJobConnection.variables}
        jobsRefetch={this.changeFilter}
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
