import * as React from 'react';
import {notification} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {RouteComponentProps} from 'react-router-dom';
import {compose} from 'recompose';
import {errorHandler} from 'utils/errorHandler';
import Detail from 'components/apps/detail';
import {PhApplicationFragment} from 'interfaces/phApplication';
import {GET_APP_TEMPLATES} from 'containers/appCreatePage';
import {get} from 'lodash';

export type AppDetailProps = {
  deleteApp: any;
  startApp: any;
  stopApp: any;
  getPhApplication: any;
  getPhAppTemplates: any;
} & RouteComponentProps<{
  appId: string;
}>;

export const STOP_APP = gql`
  mutation stopPhApplication($where: PhApplicationWhereUniqueInput!) {
    stopPhApplication(where: $where) {
      ...PhApplicationInfo
    }
  }
  ${PhApplicationFragment}
`;

export const START_APP = gql`
  mutation startPhApplication($where: PhApplicationWhereUniqueInput!) {
    startPhApplication(where: $where) {
      ...PhApplicationInfo
    }
  }
  ${PhApplicationFragment}
`;

export const DELETE_APP = gql`
  mutation deletePhApplication($where: PhApplicationWhereUniqueInput!) {
    deletePhApplication(where: $where) {
      ...PhApplicationInfo
    }
  }
  ${PhApplicationFragment}
`;

export const GET_PH_APPLICATION = gql`
  query phApplication($where: PhApplicationWhereUniqueInput!) {
    phApplication(where: $where) {
      ...PhApplicationInfo
    }
  }
  ${PhApplicationFragment}
`;

export const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';

class AppDetailContainer extends React.Component<AppDetailProps> {
  render() {
    const {getPhApplication, getPhAppTemplates, deleteApp, startApp, stopApp} = this.props;

    if (!(getPhApplication.phApplication && getPhApplication.phApplication.appName)) return null;
    if (getPhApplication.error) {
      return getMessage(getPhApplication.error);
    }
    return (
      <Detail
        deleteApp={deleteApp}
        startApp={startApp}
        stopApp={stopApp}
        phApplication={getPhApplication.phApplication || {}}
        phAppTemplates={getPhAppTemplates.phAppTemplates}
      />
    );
  }
}

export default compose(
  graphql(STOP_APP, {
    options: (props: AppDetailProps) => ({
      refetchQueries: [{
        query: GET_PH_APPLICATION,
        variables: {where: {id: props.match.params.appId}}
      }],
      onCompleted: () => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The application has been stopped.'
        });
      },
      onError: errorHandler
    }),
    name: 'stopApp'
  }),
  graphql(DELETE_APP, {
    options: (props: AppDetailProps) => ({
      onCompleted: () => {
        props.history.push(`../apps`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The application has been uninstalled.'
        });
      },
      onError: errorHandler
    }),
    name: 'deleteApp'
  }),
  graphql(START_APP, {
    options: (props: AppDetailProps) => ({
      refetchQueries: [{
        query: GET_PH_APPLICATION,
        variables: {where: {id: props.match.params.appId}}
      }],
      onCompleted: () => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The application is starting.'
        });
      },
      onError: errorHandler
    }),
    name: 'startApp'
  }),
  graphql(GET_APP_TEMPLATES, {
    name: 'getPhAppTemplates'
  }),
  graphql(GET_PH_APPLICATION, {
    options: (props: AppDetailProps) => ({
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
