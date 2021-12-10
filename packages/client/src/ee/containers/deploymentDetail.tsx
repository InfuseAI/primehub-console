import React, { useEffect, useState } from 'react';
import { notification } from 'antd';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { RouteComponentProps } from 'react-router-dom';
import { compose } from 'recompose';
import { errorHandler } from 'utils/errorHandler';
import DeploymentDetail from 'ee/components/modelDeployment/detail';
import { PhDeploymentFragment } from 'ee/components/modelDeployment/common';

type Props = {
  getPhDeployment: any;
  stopPhDeployment: (variables: any) => void;
  deletePhDeployment: (variables: any) => void;
  deployPhDeployment: (variables: any) => void;
  createPhDeploymentClient: (variables: any) => Promise<void>;
  deletePhDeploymentClient: (variables: any) => Promise<void>;
  stopPhDeploymentResult: any;
  deletePhDeploymentResult: any;
  deployPhDeploymentResult: any;
  createPhDeploymentClientResult: any;
  deletePhDeploymentClientResult: any;
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

export const DEPLOY_DEPLOYMENT = gql`
  mutation deployPhDeployment($where: PhDeploymentWhereUniqueInput!) {
    deployPhDeployment(where: $where) {
      ...PhDeploymentInfo
    }
  }
  ${PhDeploymentFragment}
`;

export const ADD_CLIENT = gql`
  mutation createPhDeploymentClient($data: PhDeploymentClientCreateInput!) {
    createPhDeploymentClient(data: $data) {
      name
      plainTextToken
    }
  }
`;

export const REMOVE_CLIENT = gql`
  mutation deletePhDeploymentClient($where: PhDeploymentClientWhereUniqueInput!) {
    deletePhDeploymentClient(where: $where) {
      ...PhDeploymentInfo
    }
  }
  ${PhDeploymentFragment}
`;



const DeploymentDetailContainer = (props: Props) => {
  const {
    getPhDeployment,
    stopPhDeployment,
    stopPhDeploymentResult,
    deletePhDeployment,
    deletePhDeploymentResult,
    deployPhDeployment,
    deployPhDeploymentResult,
    createPhDeploymentClient,
    createPhDeploymentClientResult,
    deletePhDeploymentClient,
    deletePhDeploymentClientResult,
  } = props;

  const { loading, error } = getPhDeployment;
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!loading) {
      setNotFound(error ? true : false);
    }
  }, [loading, error]);

  return (
    <DeploymentDetail
      refetchPhDeployment={getPhDeployment.refetch}
      stopPhDeployment={stopPhDeployment}
      stopPhDeploymentResult={stopPhDeploymentResult}
      deletePhDeployment={deletePhDeployment}
      deletePhDeploymentResult={deletePhDeploymentResult}
      deployPhDeployment={deployPhDeployment}
      deployPhDeploymentResult={deployPhDeploymentResult}
      createPhDeploymentClient={createPhDeploymentClient}
      createPhDeploymentClientResult={createPhDeploymentClientResult}
      deletePhDeploymentClient={deletePhDeploymentClient}
      deletePhDeploymentClientResult={deletePhDeploymentClientResult}
      notFound={notFound}
      phDeployment={getPhDeployment.phDeployment || {id: 'test'}}
    />
  );
}

export default compose(
  graphql(GET_PH_DEPLOYMENT, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.deploymentId
        }
      },
      fetchPolicy: 'cache-and-network',
      pollInterval: 2000,
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
        props.history.push(`../deployments`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The model deployment has been deleted.'
        })
      },
      onError: errorHandler
    }),
    name: 'deletePhDeployment'
  }),
  graphql(DEPLOY_DEPLOYMENT, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_DEPLOYMENT,
        variables: {where: {id: props.match.params.deploymentId}}
      }],
      onCompleted: () => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The model deployment has been deployed.'
        })
      },
      onError: errorHandler
    }),
    name: 'deployPhDeployment'
  }),
  graphql(ADD_CLIENT, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_DEPLOYMENT,
        variables: {where: {id: props.match.params.deploymentId}}
      }],
      onCompleted: () => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The client has been added.'
        })
      },
      onError: errorHandler
    }),
    name: 'createPhDeploymentClient'
  }),
  graphql(REMOVE_CLIENT, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_DEPLOYMENT,
        variables: {where: {id: props.match.params.deploymentId}}
      }],
      onCompleted: () => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The client has been removed.'
        })
      },
      onError: errorHandler
    }),
    name: 'deletePhDeploymentClient'
  })
)(DeploymentDetailContainer)
