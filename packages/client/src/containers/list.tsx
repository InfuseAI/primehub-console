import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import queryString from 'querystring';
import {withRouter} from 'react-router';
import {RouteComponentProps} from 'react-router-dom';
import withPath, { PathComponentProps } from 'components/job/withPath';
import {appPrefix} from 'utils/env';

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
  Com: any;
} & RouteComponentProps
  & PathComponentProps;

class ListContainer extends React.Component<Props> {
  render() {
    const {
      getMyGroups,
      Com,
    } = this.props;
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    if (getMyGroups.loading) return null;
    if (getMyGroups.error) return 'Error';

    const groups = get(getMyGroups, 'me.groups', [])
      .filter(group => group.id !== everyoneGroupId);

    return (
      <Com
        groups={groups}
      />
    );
  }
}

export default compose(
  withRouter,
  withPath,
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups',
    options: (props: Props) => ({
      onCompleted: data => {
        // default select all groups and first=10
        const groups = get(data, 'me.groups', []);
        const where = JSON.stringify({
          groupId_in: groups.map(group => group.id)
        });
        if (props.location.search) return;
        props.history.push({
          pathname: `${appPrefix}${props.pathname}`,
          search: queryString.stringify({where, first: 10})
        });
      },
      fetchPolicy: 'cache-and-network'
    }),
  })
)(ListContainer)
