import * as React from 'react';
import {Row, Col, Button, Skeleton, Input, message, Spin, Divider} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import {withRouter, Link} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {appPrefix} from 'utils/env';
import Pagination from 'components/share/pagination';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import DeploymentBreadcrumb from 'ee/components/modelDeployment/breadcrumb';
import Filter from 'ee/components/shared/filter';
import {Group} from 'ee/components/shared/groupFilter';
import {errorHandler} from '../components/job/errorHandler';
import DeploymentCard from 'ee/components/modelDeployment/card';
import { PhDeploymentFragment, DeploymentConnection } from 'ee/components/modelDeployment/common';
import InfuseButton from 'components/infuseButton';

const PAGE_SIZE = 8;
const Search = Input.Search

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

  searchHandler = (queryString) => {
    const {getPhDeploymentConnection} = this.props;
    const {phDeploymentsConnection, refetch, variables} = getPhDeploymentConnection;
    const newVariables = {
      ...variables,
      where: {
        ...variables.where,
        name_contains: queryString
      }
    }
    refetch(newVariables);
  }

  changeFilter = ({
    selectedGroups,
    submittedByMe
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => {
    const {getPhDeploymentConnection} = this.props;
    const {phDeploymentsConnection, refetch, variables} = getPhDeploymentConnection;
    const newVariables = {
      ...variables,
      where: {
        ...variables.where,
        groupId_in: selectedGroups,
        mine: submittedByMe,
      }
    };
    refetch(newVariables);
  }

  render() {
    const { getPhDeploymentConnection, groups, history } = this.props;
    const {
      error,
      loading,
      phDeploymentsConnection,
      variables,
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
          breadcrumb={<DeploymentBreadcrumb />}
          title={"Model Deployments"}
          style={{paddingLeft: 64}}
        />
          <PageBody>
            <div style={{textAlign: 'right', margin: '16px 0px 5px'}}>
              <Search
                placeholder="Search deploy name"
                style={{width: 295, margin: 'auto 16px'}}
                onSearch={this.searchHandler}
              />
              <InfuseButton
                icon="plus"
                type="primary"
                onClick={() => history.push(`${appPrefix}model-deployment/create`)}
                style={{marginRight: 16, width: 'auto'}}
              >
                Create Deployment
              </InfuseButton>
              <InfuseButton onClick={() => refetch()}>Refresh</InfuseButton>
            </div>
            <Filter
              labelSubmittedByMe={"Deployed By Me"}
              groups={groups}
              selectedGroups={get(variables, 'where.groupId_in', [])}
              submittedByMe={get(variables, 'where.mine', false)}
              onChange={this.changeFilter}
            />
          </PageBody>
          <div style={{margin: '16px 64px'}}>
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
            style={{position: 'absolute', left: '-1000px', top: '-1000px'}}
          />
          <Pagination
            hasNextPage={phDeploymentsConnection.pageInfo.hasNextPage}
            hasPreviousPage={phDeploymentsConnection.pageInfo.hasPreviousPage}
            nextPage={this.nextPage}
            previousPage={this.previousPage}
          />
        </div>
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
          where: JSON.parse(params.where as string || '{}'),
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getPhDeploymentConnection'
  }),
)(DeploymentListContainer)
