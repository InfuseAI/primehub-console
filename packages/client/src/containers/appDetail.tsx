import * as React from 'react';
import {notification} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {RouteComponentProps} from 'react-router-dom';
import {compose} from 'recompose';
import {errorHandler} from 'utils/errorHandler';
import Detail from 'components/apps/detail';
import {PhApplicationFragment} from 'containers/appList';
import {GET_APP_TEMPLATES} from 'containers/appCreatePage';
import {get} from 'lodash';

type Props = {
  getPhApplication: any;
  getPhAppTemplates: any;
} & RouteComponentProps<{
  appId: string;
}>;

export const GET_PH_APPLICATION = gql`
  query phApplication($where: PhApplicationWhereUniqueInput!) {
    phApplication(where: $where) {
      ...PhApplicationInfo
    }
  }
  ${PhApplicationFragment}
`;

export const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';

class AppDetailContainer extends React.Component<Props> {
  render() {
    const {getPhApplication, getPhAppTemplates} = this.props;

    if (!getPhApplication.phApplication) return null;
    if (getPhApplication.error) {
      return getMessage(getPhApplication.error);
    }
    return (
      <Detail
        phApplication={getPhApplication.phApplication || {}}
        phAppTemplates={getPhAppTemplates.phAppTemplates}
      />
    );
  }
}

export default compose(
  graphql(GET_APP_TEMPLATES, {
    name: 'getPhAppTemplates'
  }),
  graphql(GET_PH_APPLICATION, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.appId
        }
      },
      fetchPolicy: 'cache-and-network',
      pollInterval: 2000,
    }),
    name: 'getPhApplication'
  }),
)(AppDetailContainer);
