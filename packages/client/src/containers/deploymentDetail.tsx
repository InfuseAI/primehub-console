import * as React from 'react';
import {notification} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {RouteComponentProps} from 'react-router-dom';
import {compose} from 'recompose';
import {errorHandler} from 'components/job/errorHandler';
import DeploymentDetail from 'components/modelDeployment/detail';
import {PhDeploymentFragment} from 'components/modelDeployment/common';
import {get} from 'lodash';
import {appPrefix} from 'utils/env';

type Props = {
  getPhDeployment: any;
  stopPhDeployment: Function;
  deletePhDeployment: Function;
  stopPhDeploymentResult: any;
  deletePhDeploymentResult: any;
} & RouteComponentProps<{
  deploymentId: string;
}>;

export const GET_PH_DEPLOYMENT = gql`
  query phDeployment($where: PhDeploymentWhereUniqueInput!) {
    phDeployment(where: $where) {
      ...PhDeploymentInfo
    }
  }
  ${PhDeploymentFragment}
`;


export const STOP_DEPLOYMENT = gql`
  mutation stopPhDeployment($where: PhDeploymentWhereUniqueInput!) {
    stopPhDeployment(where: $where) {
      ...PhDeploymentInfo
    }
  }
  ${PhDeploymentFragment}
`;

export const DELETE_DEPLOYMENT = gql`
  mutation deletePhDeployment($where: PhDeploymentWhereUniqueInput!) {
    deletePhDeployment(where: $where) {
      ...PhDeploymentInfo
    }
  }
  ${PhDeploymentFragment}
`;

export const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';

class JobDetailContainer extends React.Component<Props> {
  render() {
    const {getPhDeployment, history, stopPhDeployment, deletePhDeployment, stopPhDeploymentResult, deletePhDeploymentResult} = this.props;
    if (getPhDeployment.loading) return null;
    if (getPhDeployment.error) {
      return getMessage(getPhDeployment.error)
    };
    return (
      <DeploymentDetail
        history={history}
        stopPhDeployment={stopPhDeployment}
        deletePhDeployment={deletePhDeployment}
        stopPhDeploymentResult={stopPhDeploymentResult}
        deletePhDeploymentResult={deletePhDeploymentResult}
        phDeployment={getPhDeployment.phDeployment || {id: 'test'}}
      />
    );
  }
}

export default compose(
  graphql(GET_PH_DEPLOYMENT, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.deploymentId
        }
      },
      fetchPolicy: 'cache-and-network'
    }),
    name: 'getPhDeployment'
  }),
  graphql(STOP_DEPLOYMENT, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_DEPLOYMENT,
        variables: {where: {id: props.match.params.deploymentId}}
      }],
      onCompleted: () => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The model deployment has been stopped.'
        })
      },
      onError: errorHandler
    }),
    name: 'stopPhDeployment'
  }),
  graphql(DELETE_DEPLOYMENT, {
    options: (props: Props) => ({
      onCompleted: () => {
        props.history.push(`${appPrefix}model-deployment`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The model deployment has been deleted.'
        })
      },
      onError: errorHandler
    }),
    name: 'deletePhDeployment'
  })
)(JobDetailContainer)
