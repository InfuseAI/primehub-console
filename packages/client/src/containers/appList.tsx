import * as React from 'react';
import {Row, Col, Modal, Skeleton, Input, message, Spin, Alert, notification} from 'antd';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {withRouter} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import Pagination from 'components/share/pagination';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import {errorHandler} from 'utils/errorHandler';
import AppCard from 'components/apps/card';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import PhApplication from 'interfaces/phApplication';
import {PhApplicationsConnection, StopPhApplication, StartPhApplication} from 'queries/PhApplication.graphql';

const {confirm} = Modal;

export interface ApplicationConnection {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  edges: Array<{
    cursor: string;
    node: PhApplication;
  }>;
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

type Props = {
  startApp: any;
  stopApp: any;
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
  private textArea: React.RefObject<any> = React.createRef();

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

  startApp = (appId, appName) => {
    const {startApp} = this.props;
    confirm({
      title: `Start App`,
      content: <span>Do you want to start "<b>{appName}</b>"?</span>,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        return startApp({variables: {where: {id: appId}}});
      },
    });
  }

  stopApp = (appId, appName) => {
    const {stopApp} = this.props;
    confirm({
      title: `Stop App`,
      content: <span>Do you want to stop "<b>{appName}</b>"?</span>,
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return stopApp({variables: {where: {id: appId}}});
      },
    });
  }

  searchHandler = query => {
    const {getPhApplicationConnection} = this.props;
    const {refetch, variables} = getPhApplicationConnection;
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
      phApplicationsConnection,
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
          Applications
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
        <Spin spinning={!(phApplicationsConnection && phApplicationsConnection.edges)}>
          <Row gutter={24} type='flex'>
            {phApplicationsConnection.edges.map(edge => {
              return (
                <Col xs={24} md={12} xl={8} xxl={6} key={edge.cursor} style={{marginBottom: 16}}>
                  <AppCard
                    startApp={this.startApp}
                    stopApp={this.stopApp}
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
  graphql(PhApplicationsConnection, {
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
        fetchPolicy: 'cache-and-network',
        pollInterval: 2000,
      };
    },
    name: 'getPhApplicationConnection',
    alias: 'withPhApplicationConnection'
  }),
  graphql(StartPhApplication, {
    options: () => ({
      onCompleted: () => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The application is starting.'
        });
      },
      onError: errorHandler
    }),
    name: 'startApp',
    alias: 'withStartApp'
  }),
  graphql(StopPhApplication, {
    options: () => ({
      onCompleted: () => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'The application has been stopped.'
        });
      },
      onError: errorHandler
    }),
    name: 'stopApp',
    alias: 'withStopApp'
  }),
)(AppListContainer);
