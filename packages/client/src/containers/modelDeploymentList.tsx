import * as React from 'react';
import {Row, Col, Button, Skeleton, Input, message, Spin} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {withRouter, Link} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {appPrefix} from 'utils/env';
import Pagination from 'components/share/pagination';
import PageTitle from 'components/modelDeployment/pageTitle';
import DeploymentCard from 'components/modelDeployment/card';
import { PhDeploymentFragment, DeploymentConnection } from 'components/modelDeployment/common';
import InfuseButton from 'components/infuseButton';

const PAGE_SIZE = 8;

export const GET_PH_DEPLOYMENT_CONNECTION = gql`
  query phDeploymentsConnection($where: PhDeploymentWhereInput, $first: Int, $after: String, $last: Int, $before: String) {
    phDeploymentsConnection(where: $where, first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          ...PhDeploymentInfo
        }
      }
    }
  }
  ${PhDeploymentFragment}
`;

type Props = {
  getPhDeploymentConnection: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
      after?: string,
      first?: number,
      last?: number,
      before?: string
    };
    refetch: Function;
    phDeploymentsConnection: DeploymentConnection
  };
} & RouteComponentProps;

type State = {
  value: string;
}

class DeploymentListContainer extends React.Component<Props, State> {
  textArea: React.RefObject<any> = React.createRef();

  copyClipBoard = value => {
    if (this.textArea && this.textArea.current) {
      this.textArea.current.input.value = value;
      this.textArea.current.select();
      document.execCommand('copy');
      message.success('copied');
    }
  }

  nextPage = () => {
    const {getPhDeploymentConnection} = this.props;
    const {phDeploymentsConnection, refetch} = getPhDeploymentConnection;
    const after = phDeploymentsConnection.pageInfo.endCursor;
    const newVariables = {
      after,
      first: PAGE_SIZE,
      last: undefined,
      before: undefined
    };
    refetch(newVariables);
  }

  previousPage = () => {
    const {getPhDeploymentConnection} = this.props;
    const {phDeploymentsConnection, refetch} = getPhDeploymentConnection;
    const before = phDeploymentsConnection.pageInfo.startCursor;
    const newVariables = {
      before,
      last: PAGE_SIZE,
      first: undefined,
      after: undefined,
    };
    refetch(newVariables);
  }

  render() {
    const { getPhDeploymentConnection } = this.props;
    const {
      error,
      loading,
      phDeploymentsConnection,
      refetch
    } = getPhDeploymentConnection;
    if (error) {
      console.log(getPhDeploymentConnection.error);
      return 'Error';
    }

    if (!phDeploymentsConnection) {
      return <Skeleton />
    }

    return (
      <>
        <PageTitle
          title="Model Deployments"
          extra={(
            <div>
              <InfuseButton
                style={{marginRight: 16, width: 'auto'}}
              >
                <Link to={`${appPrefix}model-deployment/create`}>
                  Create Deployment
                </Link>
              </InfuseButton>
              <InfuseButton onClick={() => refetch()}>Refresh</InfuseButton>
            </div>
          )}
        />
        <Spin spinning={loading}>
          <Row gutter={36} type="flex">
            {phDeploymentsConnection.edges.map(edge => {
              return (
                <Col span={6} key={edge.cursor} style={{marginBottom: 36}}>
                  <DeploymentCard
                    deployment={edge.node}
                    copyClipBoard={this.copyClipBoard}
                  />
                </Col>
              );
            })}
          </Row>
        </Spin>
        <Input
          ref={this.textArea}
          style={{display: 'none'}}
        />
        <Pagination
          hasNextPage={phDeploymentsConnection.pageInfo.hasNextPage}
          hasPreviousPage={phDeploymentsConnection.pageInfo.hasPreviousPage}
          nextPage={this.nextPage}
          previousPage={this.previousPage}
        />
      </>
    );
  }
}

export default compose(
  withRouter,
  graphql(GET_PH_DEPLOYMENT_CONNECTION, {
    options: (props: Props) => {
      const params = queryString.parse(props.location.search.replace(/^\?/, ''));
      return {
        variables: {
          first: PAGE_SIZE,
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getPhDeploymentConnection'
  }),
)(DeploymentListContainer)
