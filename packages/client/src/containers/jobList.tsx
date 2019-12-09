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

type Props = {
  getPhJobConnection?: any;
  groups: Array<Group>;
}

class JobListContainer extends React.Component<Props> {
  render() {
    const {getPhJobConnection, groups} = this.props;
    return (
      <JobList
        jobsLoading={getPhJobConnection.loading}
        jobsError={getPhJobConnection.error}
        jobsConnection={getPhJobConnection.phJobsConnection || {pageInfo: {}, edges: []}}
        jobsVariables={getPhJobConnection.variables}
        jobsRefetch={getPhJobConnection.refetch}
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
          }
        },
      }
    },
    name: 'getPhJobConnection'
  })
)(JobListContainer)
