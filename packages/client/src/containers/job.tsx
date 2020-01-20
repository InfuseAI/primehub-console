import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import JobListContainer from 'containers/jobList';
import {FilterPayload} from 'containers/types';

export const GroupFragment = gql`
  fragment GroupInfo on Group {
    id
    displayName
    name
  }
`;

export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
      }
    }
  }
  ${GroupFragment}
`

type Props = {
  getMyGroups: any;
  changeFilter: (payload: FilterPayload) => void;
} & FilterPayload;
class JobContainer extends React.Component<Props> {
  render() {
    const {
      getMyGroups,
      changeFilter,
      where,
      after,
      before,
      last,
      first
    } = this.props;
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    if (getMyGroups.loading) return null;
    if (getMyGroups.error) return 'Error';

    const groups = get(getMyGroups, 'me.groups', [])
      .filter(group => group.id !== everyoneGroupId);

    return (
      <JobListContainer
        groups={groups}
        changeFilter={changeFilter}
        where={where}
        after={after}
        before={before}
        last={last}
        first={first}
      />
    );
  }
}

export default compose(
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups',
    options: (props: Props) => ({
      onCompleted: data => {
        // default select all groups
        const groups = get(data, 'me.groups', []);
        props.changeFilter({where: {
          groupId_in: groups.map(group => group.id)
        }});
      }
    })
  })
)(JobContainer)
