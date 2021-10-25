import * as React from 'react';
import {
  Row,
  Col,
  Input,
  Spin,
  Alert,
  Checkbox,
  notification,
  Divider,
} from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { withRouter, useHistory } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import Breadcrumbs from 'components/share/breadcrumb';
import Pagination from 'components/share/pagination';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { DeploymentConnection } from 'ee/components/modelDeployment/common';
import {
  GroupContext,
  GroupContextComponentProps,
  withGroupContext,
} from 'context/group';
import { errorHandler } from 'utils/errorHandler';

import { DeploymentCard } from './DeploymentCard';
import {
  DeploymentsQuery,
  startPhDeploymentMutation,
  stopPhDeploymentMutation,
} from './deployment.graphql';

const DEFAULT_PAGE_SIZE = 12;
const Search = Input.Search;

type QueryVariables = {
  after?: string;
  first?: number;
  last?: number;
  before?: string;
  where?: {
    id: string;
    mine?: boolean;
    search?: string;
    groupId_in?: string[];
  };
};

type Props = {
  groups: {
    id: string;
    name: string;
    displayName: string;
    enabledDeployment: boolean;
  }[];
  phDeployments: {
    error?: Error | undefined;
    loading: boolean;
    variables: QueryVariables;
    refetch: (variables?: QueryVariables) => void;
    phDeploymentsConnection: DeploymentConnection;
  };
  startPhApp: ({ variables }: { variables: QueryVariables }) => void;
  stopPhApp: ({ variables }: { variables: QueryVariables }) => void;
} & RouteComponentProps &
  GroupContextComponentProps;

function CommonPageTitle() {
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/deployments/,
      title: 'Deployments',
      link: '/deployments',
      tips: 'Users can deploy and serve models as services here.',
      tipsLink: 'https://docs.primehub.io/docs/model-deployment-feature',
    },
  ];

  return (
    <PageTitle
      title='Model Deployments'
      breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
    />
  );
}

function DeploymentListContainer({ groups, phDeployments, ...props }: Props) {
  const groupContext = React.useContext(GroupContext);
  const [keyword, setKeyword] = React.useState('');
  const [isDeployedByMe, setIsDeployedByme] = React.useState(false);
  const history = useHistory();

  function getPreviousPage() {
    const { phDeploymentsConnection, refetch } = phDeployments;
    const before = phDeploymentsConnection.pageInfo.startCursor;

    refetch({
      last: DEFAULT_PAGE_SIZE,
      before,
      first: undefined,
      after: undefined,
    });
  }

  function getNextPage() {
    const { phDeploymentsConnection, refetch } = phDeployments;
    const after = phDeploymentsConnection.pageInfo.endCursor;

    refetch({
      first: DEFAULT_PAGE_SIZE,
      after,
      last: undefined,
      before: undefined,
    });
  }

  function searchHandler(keyword: string) {
    const { refetch, variables } = phDeployments;

    refetch({
      ...variables,
      where: {
        ...variables.where,
        search: keyword,
      },
    });
  }

  if (groupContext) {
    const group = groups.find(group => group.id === groupContext.id);

    if (!group) {
      return (
        <>
          <CommonPageTitle />
          <PageBody>
            <Alert
              message='Group not found'
              description={`Group ${groupContext.name} is not found or not authorized.`}
              type='error'
              showIcon
            />
          </PageBody>
        </>
      );
    }

    if (!group.enabledDeployment) {
      return (
        <>
          <CommonPageTitle />
          <PageBody>
            <Alert
              message='Feature not available'
              description='Model Deployment is not enabled for this group. Please contact your administrator to enable it.'
              type='warning'
              showIcon
            />
          </PageBody>
        </>
      );
    }
  }

  if (phDeployments.error) {
    return <div>Failure to load deployments.</div>;
  }

  return (
    <>
      <CommonPageTitle />

      <PageBody>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: '1rem',
          }}
        >
          <Checkbox
            disabled={phDeployments.loading}
            checked={isDeployedByMe}
            onChange={event => {
              const isChecked = event.target.checked;
              setIsDeployedByme(isChecked);

              const { refetch, variables } = phDeployments;

              if (isChecked) {
                refetch({
                  ...variables,
                  where: {
                    ...variables.where,
                    mine: true,
                  },
                });
              } else {
                refetch({
                  ...variables,
                  where: {
                    ...variables.where,
                    mine: false,
                  },
                });
              }
            }}
          >
            Deployed By Me
          </Checkbox>

          <Divider
            type='vertical'
            style={{ height: '30px', margin: '0 8px 0 0' }}
          />

          <InfuseButton
            disabled={phDeployments.loading}
            onClick={() => phDeployments.refetch()}
          >
            Refresh
          </InfuseButton>
          {/* @ts-ignore */}
          <InfuseButton
            icon='plus'
            type='primary'
            onClick={() => history.push(`deployments/create`)}
          >
            Create Deployment
          </InfuseButton>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <Search
            placeholder='Search by name'
            value={keyword}
            onChange={event => setKeyword(event.currentTarget.value)}
            onSearch={searchHandler}
          />
          <InfuseButton
            disabled={phDeployments.loading}
            onClick={() => searchHandler(keyword)}
          >
            Search
          </InfuseButton>
          <InfuseButton
            disabled={phDeployments.loading}
            onClick={() => {
              setKeyword('');

              const { refetch, variables } = phDeployments;

              refetch({
                ...variables,
                where: {
                  ...variables.where,
                  search: '',
                },
              });
            }}
          >
            Reset
          </InfuseButton>
        </div>
      </PageBody>

      <Spin spinning={phDeployments.loading}>
        <div style={{ padding: '16px' }}>
          <Row gutter={24} type='flex'>
            {phDeployments?.phDeploymentsConnection?.edges
              .filter(edge => edge.node?.name)
              .map(edge => {
                return (
                  <Col
                    xs={24}
                    md={12}
                    xl={8}
                    key={edge.cursor}
                    style={{ marginBottom: 16 }}
                  >
                    <DeploymentCard
                      {...edge.node}
                      onStart={() => {
                        props.startPhApp({
                          variables: { where: { id: edge.node.id } },
                        });
                      }}
                      onStop={() => {
                        props.stopPhApp({
                          variables: { where: { id: edge.node.id } },
                        });
                      }}
                    />
                  </Col>
                );
              })}
          </Row>

          <Pagination
            hasNextPage={
              phDeployments?.phDeploymentsConnection?.pageInfo.hasNextPage
            }
            hasPreviousPage={
              phDeployments?.phDeploymentsConnection?.pageInfo.hasPreviousPage
            }
            nextPage={getNextPage}
            previousPage={getPreviousPage}
          />
        </div>
      </Spin>
    </>
  );
}

export default compose(
  withRouter,
  withGroupContext,
  graphql(DeploymentsQuery, {
    options: ({ groupContext, location, ...props }: Props) => {
      const querystring = new URLSearchParams(location.search);
      const pageSize = Number(querystring.get('first')) || DEFAULT_PAGE_SIZE;

      return {
        variables: {
          first: pageSize,
          where: {
            groupId_in: [groupContext.id],
          },
        },
        onError: errorHandler,
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'phDeployments',
  }),
  graphql(startPhDeploymentMutation, {
    name: 'startPhApp',
    options: {
      onCompleted: () => {
        notification.success({
          message: 'The model deployment has been deployed.',
          duration: 5,
          placement: 'bottomRight',
        });
      },
      onError: errorHandler,
    },
  }),
  graphql(stopPhDeploymentMutation, {
    name: 'stopPhApp',
    options: {
      onCompleted: () => {
        notification.success({
          message: 'The model deployment has been stopped.',
          duration: 5,
          placement: 'bottomRight',
        });
      },
      onError: errorHandler,
    },
  })
)(DeploymentListContainer);
