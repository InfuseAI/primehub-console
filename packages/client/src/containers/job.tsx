import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import queryString from 'querystring';
import JobListContainer from 'containers/jobList';
import {withRouter} from 'react-router';
import {RouteComponentProps} from 'react-router-dom';

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
} & RouteComponentProps;

const appPrefix = (window as any).APP_PREFIX || '/';

class JobContainer extends React.Component<Props> {
  render() {
    const {
      getMyGroups,
    } = this.props;
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    if (getMyGroups.loading) return null;
    if (getMyGroups.error) return 'Error';

    const groups = get(getMyGroups, 'me.groups', [])
      .filter(group => group.id !== everyoneGroupId);

    return (
      <JobListContainer
        groups={groups}
      />
    );
  }
}

export default compose(
  withRouter,
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups',
    options: (props: Props) => ({
      onCompleted: data => {
        // default select all groups
        const groups = get(data, 'me.groups', []);
        const where = JSON.stringify({
          groupId_in: groups.map(group => group.id)
        });
        props.history.push({
          pathname: `${appPrefix}job`,
          search: queryString.stringify({where})
        });
      }
    })
  })
)(JobContainer)
