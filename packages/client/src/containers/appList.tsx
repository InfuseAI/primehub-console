import * as React from 'react';
import {Row, Col, Button, Skeleton, Input, message, Spin, Divider, Alert} from 'antd';
import {ButtonType} from 'antd/lib/button';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import {withRouter, Link} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import Pagination from 'components/share/pagination';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Filter from 'ee/components/shared/filter';
import {Group} from 'ee/components/shared/groupFilter';
import {errorHandler} from 'utils/errorHandler';
import AppCard from 'components/apps/card';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';

export interface ApplicationConnection {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  edges: Array<{
    cursor: string;
    node: ApplicationInfo;
  }>;
}

export const PhApplicationFragment = gql`
fragment PhApplicationInfo on PhApplication {
  id
  icon
  displayName
  appVersion
  appName
  appIcon
  appDefaultEnv
  groupName
  instanceType
  scope
  appUrl
  internalAppUrl
  svcEndpoint
  env
  stop
  status
  message
}
`;

export interface ApplicationInfo {
  id: string;
  displayName: string;
  appName: string;
  appVersion: string;
  appIcon: string;
  appDefaultEnv: Array<{name: string, description: string, defaultValue: string, optional: boolean}>;
  groupName: string;
  instanceType: {
    id: string;
    name: string;
    displayName: string;
    cpuLimit: number;
    memoryLimit: number;
    gpuLimit: number;
  };
  scope: string;
  appUrl: string;
  internalAppUrl: string;
  svcEndpoint: string[];
  env: Array<{name: string, value: string}>;
  stop: boolean;
  status: string;
  message: string;
}

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/apps/,
    title: 'Apps',
    link: '/apps?page=1'
  }
];

const PAGE_SIZE = 12;
const Search = Input.Search;

export const GET_PH_APPLICATION_CONNECTION = gql`
  query phApplicationsConnection($where: PhApplicationsWhereInput, $first: Int, $after: String, $last: Int, $before: String) {
    phApplicationsConnection(where: $where, first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          ...PhApplicationInfo
        }
      }
    }
  }
  ${PhApplicationFragment}
`;

type Props = {
  groups: Array<{
    id: string;
    name: string;
    displayName: string;
    enabledDeployment: boolean;
  }>;
  getPhApplicationConnection: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
      after?: string,
      first?: number,
      last?: number,
      before?: string
    };
    refetch: ({}?) => void;
    phApplicationsConnection: ApplicationConnection
  };
} & RouteComponentProps & GroupContextComponentProps;

interface State {
  value: string;
}

class AppListContainer extends React.Component<Props, State> {
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
    const {getPhApplicationConnection} = this.props;
    const {phApplicationsConnection, refetch} = getPhApplicationConnection;
    const after = phApplicationsConnection.pageInfo.endCursor;
    const newVariables = {
      after,
      first: PAGE_SIZE,
      last: undefined,
      before: undefined
    };
    refetch(newVariables);
  }

  previousPage = () => {
    const {getPhApplicationConnection} = this.props;
    const {phApplicationsConnection, refetch} = getPhApplicationConnection;
    const before = phApplicationsConnection.pageInfo.startCursor;
    const newVariables = {
      before,
      last: PAGE_SIZE,
      first: undefined,
      after: undefined,
    };
    refetch(newVariables);
  }

  searchHandler = query => {
    const {getPhApplicationConnection} = this.props;
    const {phApplicationsConnection, refetch, variables} = getPhApplicationConnection;
    const newVariables = {
      ...variables,
      where: {
        ...variables.where,
        name_contains: query
      }
    };
    refetch(newVariables);
  }

  changeFilter = ({
    selectedGroups,
    submittedByMe
  }: {
    selectedGroups: string[];
    submittedByMe: boolean;
  }) => {
    const {groupContext, getPhApplicationConnection} = this.props;
    const {variables, refetch} = getPhApplicationConnection;
    const newVariables = {
      ...variables,
      where: {
        ...variables.where,
        mine: submittedByMe,
      }
    };

    if (!groupContext) {
      newVariables.where.groupName_in = selectedGroups;
    }

    refetch(newVariables);
  }

  render() {
    const { groupContext, getPhApplicationConnection, groups, history } = this.props;
    const {
      error,
      loading,
      phApplicationsConnection,
      variables,
      refetch
    } = getPhApplicationConnection;

    if (error) {
      console.log(getPhApplicationConnection.error);
      return 'Error';
    }

    if (!phApplicationsConnection) {
      return <Skeleton />;
    }

    let showContent = true;

    let pageBody = <>
      <div style={{textAlign: 'right'}}>
        <InfuseButton
          icon='plus'
          type='primary'
          onClick={() => {
            history.push(`apps/store`);
          }}
          style={{marginRight: 16, width: 'auto'}}
        >
          New App
        </InfuseButton>
        <InfuseButton onClick={() => refetch()}>Refresh</InfuseButton>
      </div>
    </>;

    if (groupContext) {
      const group = groups.find(g => g.id === groupContext.id);
      if (!group) {
        pageBody = <Alert
          message='Group not found'
          description={`Group ${groupContext.name} is not found or not authorized.`}
          type='error'
          showIcon/>;
        showContent = false;
      }
    }

    const content = (
      <div style={{margin: '16px 16px'}}>
        <Spin spinning={loading}>
          <Row gutter={24} type='flex'>
            {phApplicationsConnection.edges.map(edge => {
              return (
                <Col xs={24} md={12} xl={8} xxl={6} key={edge.cursor} style={{marginBottom: 16}}>
                  <AppCard
                    application={edge.node}
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
          hasNextPage={phApplicationsConnection.pageInfo.hasNextPage}
          hasPreviousPage={phApplicationsConnection.pageInfo.hasPreviousPage}
          nextPage={this.nextPage}
          previousPage={this.previousPage}
        />
      </div>
    );

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Apps'}
        />
        <PageBody>{pageBody}</PageBody>
        { showContent ? content : <></> }
      </>
    );
  }
}

export default compose(
  withRouter,
  graphql(GET_PH_APPLICATION_CONNECTION, {
    options: (props: Props) => {
      const params = queryString.parse(props.location.search.replace(/^\?/, ''));
      const {groupContext} = props;
      const where = JSON.parse(params.where as string || '{}');
      if (groupContext) {
        where.groupName_in = [groupContext.name];
      }

      return {
        variables: {
          first: PAGE_SIZE,
          where,
        },
        fetchPolicy: 'cache-and-network'
      };
    },
    name: 'getPhApplicationConnection'
  }),
)(AppListContainer);
