import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import JobList from 'components/job/list';
import {Phase} from 'components/job/phase';

export const PhJobFragement = gql`
  fragment PhJobInfo on PhJob {
    id
    displayName
    cancel
    command
    group
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

export const GroupFragment = gql`
  fragment GroupInfo on Group {
    id
    displayName
    name
  }
`;

export const GET_GROUPS = gql`
  query groups {
    groups {
      ...GroupInfo
    }
  }
  ${GroupFragment}
`

export const GET_PH_JOB_CONNECTION = gql`
  query phJobsConnection($where: PhJobWhereInput, $first: Int, $after: String, $last: Int, $before: String) {
    phJobsConnection(where: $where, first: $first, after: $after, last: $last, before: $before) {
      pagInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        ...PhJobInfo
      }
    }
  }
  ${PhJobFragement}
`;

const defaultVariables = {
  first: 10,
  where: {}
};

const job = {
  id: 'y23456',
  displayName: 'train_123 model by using yyy_pretrained_model',
  cancel: false,
  command: 'command',
  group: 'dev-group',
  userId: 'userId',
  userName: 'userName',
  phase: Phase.Succedded,
  reasion: 'resione',
  startTime: new Date().toString(),
  finsihTime: new Date().toString(),
  logEndpoint: '/'
};

const jobsConnection = {
  pageInfo: {
    hasNextPage: true,
    hasPreviousPage: true
  },
  edges: [{
    cursor: 'id',
    node: job
  }]
};

const groups = [{
  displayName: 'dev-group',
  id: 'group1'
}, {
  displayName: 'dev-group2',
  id: 'group2'
}, {
  displayName: 'dev-group3',
  id: 'group3'
}, {
  displayName: 'dev-group4',
  id: 'group4'
}];

type Props = {
  getPhJobConnection: any;
  getGroups: any;
}

class JobListContainer extends React.Component<Props> {
  render() {
    const {getPhJobConnection, getGroups} = this.props;
    return (
      <JobList
        jobsLoading={getPhJobConnection.loading}
        jobsError={getPhJobConnection.error}
        jobsConnection={getPhJobConnection.phJobsConnection || jobsConnection}
        jobsVariables={getPhJobConnection.variables}
        jobsRefetch={getPhJobConnection.refetch}
        groupsLoading={getGroups.loading}
        groupsError={getGroups.error}
        groups={getGroups.groups || groups}
      />
    );
  }
}

export default compose(
  graphql(GET_PH_JOB_CONNECTION, {
    options: {
      variables: defaultVariables,
    },
    name: 'getPhJobConnection'
  }),
  graphql(GET_GROUPS, {
    name: 'getGroups'
  })
)(JobListContainer)