import * as React from 'react';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get } from 'lodash';
import queryString from 'querystring';
import { withRouter } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';

import withPath, { PathComponentProps } from 'ee/components/job/withPath';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import { CurrentUser } from 'queries/User.graphql';

type Props = RouteComponentProps &
  PathComponentProps & {
    currentUser: any;
    groupContext: GroupContextComponentProps;
    Com: React.ElementType;
  };

function ListContainer({ groupContext, currentUser, Com }: Props) {
  if (currentUser.loading) {
    return <div data-testid="loading" />;
  }

  if (currentUser.error) {
    return <div>Error</div>;
  }

  const everyoneGroupId = window.EVERYONE_GROUP_ID;
  const groups = get(currentUser, 'me.groups', []).filter(
    (group) => group.id !== everyoneGroupId
  );

  return <Com groups={groups} groupContext={groupContext} />;
}

export default compose(
  withRouter,
  withPath,
  withGroupContext,
  graphql(CurrentUser, {
    alias: 'withCurrentUser',
    name: 'currentUser',
    options: (props: Props) => ({
      onCompleted: () => {
        // default  page=1
        if (props.location.search) return;
        props.history.replace({
          pathname: props.location.pathname,
          search: queryString.stringify({ page: 1 }),
        });
      },
      fetchPolicy: 'cache-and-network',
    }),
  })
)(ListContainer);
