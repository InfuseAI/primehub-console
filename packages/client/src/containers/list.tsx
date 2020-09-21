import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import queryString from 'querystring';
import {withRouter} from 'react-router';
import {RouteComponentProps} from 'react-router-dom';
import withPath, { PathComponentProps } from 'ee/components/job/withPath';
import {appPrefix} from 'utils/env';
import {withGroupContext, GroupContextComponentProps, GroupContext} from 'context/group';

export const GroupFragment = gql`
  fragment GroupInfo on Group {
    id
    displayName
    name
    quotaCpu
    quotaGpu
    quotaMemory
    datasets {
      displayName
    }
    resourceStatus {
      cpuUsage
      memUsage
      gpuUsage
    }
    enabledDeployment
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
  & PathComponentProps
  & GroupContextComponentProps;

class ListContainer extends React.Component<Props> {
  render() {
    const {
      groupContext,
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
        groupContext={groupContext}
      />
    );
  }
}

export default compose(
  withRouter,
  withPath,
  withGroupContext,
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups',
    options: (props: Props) => ({
      onCompleted: data => {
        // default  page=1
        if (props.location.search) return;
        props.history.replace({
          pathname: props.location.pathname,
          search: queryString.stringify({page: 1})
        });
      },
      fetchPolicy: 'cache-and-network'
    }),
  })
)(ListContainer)
