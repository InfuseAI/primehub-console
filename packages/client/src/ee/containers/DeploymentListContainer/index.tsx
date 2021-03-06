import * as React from 'react';
import { Row, Col, Skeleton, Input, message, Spin, Alert } from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get } from 'lodash';
import { withRouter } from 'react-router-dom';
import queryString from 'querystring';
import { RouteComponentProps } from 'react-router';
import Pagination from 'components/share/pagination';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Filter from 'ee/components/shared/filter';
import DeploymentCard from 'ee/components/modelDeployment/card';
import { DeploymentConnection } from 'ee/components/modelDeployment/common';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import { PhDeploymentsConnection } from 'queries/PhDeployment.graphql';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/deployments/,
    title: 'Deployments',
    link: '/deployments?page=1',
    tips: 'Users can deploy and serve models as services here.',
    tipsLink: 'https://docs.primehub.io/docs/model-deployment-feature',
  },
];

const PAGE_SIZE = 12;
const Search = Input.Search;

type Props = {
  groups: Array<{
    id: string;
    name: string;
    displayName: string;
    enabledDeployment: boolean;
  }>;
  getPhDeploymentConnection: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
      after?: string;
      first?: number;
      last?: number;
      before?: string;
    };
    refetch: Function;
    phDeploymentsConnection: DeploymentConnection;
  };
} & RouteComponentProps &
  GroupContextComponentProps;

type State = {
  value: string;
};

class DeploymentListContainer extends React.Component<Props, State> {
  textArea: React.RefObject<any> = React.createRef();

  copyClipBoard = (value) => {
    if (this.textArea && this.textArea.current) {
      this.textArea.current.input.value = value;
      this.textArea.current.select();
      document.execCommand('copy');
      message.success('copied');
    }
  };

  nextPage = () => {
    const { getPhDeploymentConnection } = this.props;
    const { phDeploymentsConnection, refetch } = getPhDeploymentConnection;
    const after = phDeploymentsConnection.pageInfo.endCursor;
    const newVariables = {
      after,
      first: PAGE_SIZE,
      last: undefined,
      before: undefined,
    };
    refetch(newVariables);
  };

  previousPage = () => {
    const { getPhDeploymentConnection } = this.props;
    const { phDeploymentsConnection, refetch } = getPhDeploymentConnection;
    const before = phDeploymentsConnection.pageInfo.startCursor;
    const newVariables = {
      before,
      last: PAGE_SIZE,
      first: undefined,
      after: undefined,
    };
    refetch(newVariables);
  };

  searchHandler = (queryString) => {
    const { getPhDeploymentConnection } = this.props;
    const { refetch, variables } = getPhDeploymentConnection;
    const newVariables = {
      ...variables,
      where: {
        ...variables.where,
        name_contains: queryString,
      },
    };
    refetch(newVariables);
  };

  changeFilter = ({
    selectedGroups,
    submittedByMe,
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => {
    const { groupContext, getPhDeploymentConnection } = this.props;
    const { variables, refetch } = getPhDeploymentConnection;
    const newVariables = {
      ...variables,
      where: {
        ...variables.where,
        mine: submittedByMe,
      },
    };

    if (!groupContext) {
      newVariables.where.groupId_in = selectedGroups;
    }

    refetch(newVariables);
  };

  render() {
    const { groupContext, getPhDeploymentConnection, groups, history } =
      this.props;
    const { loading, phDeploymentsConnection, variables, refetch } =
      getPhDeploymentConnection;

    if (getPhDeploymentConnection.error) {
      return <div>Error</div>;
    }

    if (!phDeploymentsConnection) {
      return (
        <div data-testid="loading">
          <Skeleton />
        </div>
      );
    }

    let showContent = true;

    let pageBody = (
      <>
        <div style={{ textAlign: 'right' }}>
          <Search
            placeholder="Search deploy name"
            style={{ width: 295, margin: 'auto 16px' }}
            onSearch={this.searchHandler}
          />
          {/* @ts-ignore */}
          <InfuseButton
            icon="plus"
            type="primary"
            onClick={() => history.push(`deployments/create`)}
            style={{ marginRight: 16, width: 'auto' }}
          >
            Create Deployment
          </InfuseButton>
          <InfuseButton onClick={() => refetch()}>Refresh</InfuseButton>
        </div>
        <Filter
          groupContext={groupContext}
          labelSubmittedByMe={'Deployed By Me'}
          groups={groups}
          selectedGroups={get(variables, 'where.groupId_in', [])}
          submittedByMe={get(variables, 'where.mine', false)}
          onChange={this.changeFilter}
        />
      </>
    );

    if (groupContext) {
      const group = groups.find((group) => group.id === groupContext.id);
      if (!group) {
        pageBody = (
          <Alert
            message="Group not found"
            description={`Group ${groupContext.name} is not found or not authorized.`}
            type="error"
            showIcon
          />
        );
        showContent = false;
      } else if (group.enabledDeployment !== true) {
        pageBody = (
          <Alert
            message="Feature not available"
            description="Model Deployment is not enabled for this group. Please contact your administrator to enable it."
            type="warning"
            showIcon
          />
        );
        showContent = false;
      }
    }

    const content = (
      <div style={{ margin: '16px 16px' }}>
        <Spin spinning={loading}>
          <Row gutter={24} type="flex">
            {phDeploymentsConnection.edges.map((edge) => {
              return (
                <Col
                  xs={24}
                  md={12}
                  xl={8}
                  xxl={6}
                  key={edge.cursor}
                  style={{ marginBottom: 16 }}
                >
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
          style={{ position: 'absolute', left: '-1000px', top: '-1000px' }}
        />
        <Pagination
          hasNextPage={phDeploymentsConnection.pageInfo.hasNextPage}
          hasPreviousPage={phDeploymentsConnection.pageInfo.hasPreviousPage}
          nextPage={this.nextPage}
          previousPage={this.previousPage}
        />
      </div>
    );

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Model Deployments'}
        />
        <PageBody>{pageBody}</PageBody>
        {showContent ? content : <></>}
      </>
    );
  }
}

export default compose(
  withRouter,
  graphql(PhDeploymentsConnection, {
    options: (props: Props) => {
      const params = queryString.parse(
        props.location.search.replace(/^\?/, '')
      );
      const { groupContext } = props;
      const where = JSON.parse((params.where as string) || '{}');
      if (groupContext) {
        where.groupId_in = [groupContext.id];
      }

      return {
        variables: {
          first: PAGE_SIZE,
          where,
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getPhDeploymentConnection',
  })
)(DeploymentListContainer);
