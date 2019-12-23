import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import JobList from 'components/job/list';
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
}

class JobListContainer extends React.Component<Props> {
  render() {
    const {getPhJobConnection, groups, rerunPhJob, cancelPhJob, rerunPhJobResult, cancelPhJobResult} = this.props;
    return (
      <JobList
        jobsLoading={getPhJobConnection.loading}
        jobsError={getPhJobConnection.error}
        jobsConnection={getPhJobConnection.phJobsConnection || {pageInfo: {}, edges: []}}
        jobsVariables={getPhJobConnection.variables}
        jobsRefetch={getPhJobConnection.refetch}
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
  graphql(GET_PH_JOB_CONNECTION, {
    options: (props: Props) => {
      return {
        variables: {
          where: {
            groupId_in: props.groups.map(group => group.id)
          },
          first: 10,
        },
      }
    },
    name: 'getPhJobConnection'
  }),
  graphql(RERUN_JOB, {
    options: {
      refetchQueries: [{
        query: GET_PH_JOB_CONNECTION
      }]
    },
    name: 'rerunPhJob'
  }),
  graphql(CANCEL_JOB, {
    options: {
      refetchQueries: [{
        query: GET_PH_JOB_CONNECTION
      }]
    },
    name: 'cancelPhJob'
  })
)(JobListContainer)
