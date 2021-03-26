import * as React from 'react';
import {notification} from 'antd';
import {graphql} from 'react-apollo';
import {RouteComponentProps} from 'react-router-dom';
import {compose} from 'recompose';
import {errorHandler} from 'utils/errorHandler';
import Detail from 'components/apps/detail';
import {GetPhAppTemplates} from 'queries/PhAppTemplate.graphql';
import {GetPhApplication, StartPhApplication, StopPhApplication, DeletePhApplication} from 'queries/PhApplication.graphql';

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
  graphql(StopPhApplication, {
    options: (props: AppDetailProps) => ({
      refetchQueries: [{
        query: GetPhApplication,
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
  graphql(DeletePhApplication, {
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
  graphql(StartPhApplication, {
    options: (props: AppDetailProps) => ({
      refetchQueries: [{
        query: GetPhApplication,
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
  graphql(GetPhAppTemplates, {
    name: 'getPhAppTemplates'
  }),
  graphql(GetPhApplication, {
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
