import * as React from 'react';
import {Layout, Skeleton} from 'antd';
import {Route, Switch, RouteComponentProps} from 'react-router-dom';
import Header from 'components/header';
import GroupSelector from 'components/groupSelector';
import Sidebar from 'components/hub/sidebar';
import styled from 'styled-components';
import { Redirect } from 'react-router';
import {appPrefix} from 'utils/env';
import {get} from 'lodash';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {withRouter} from 'react-router';
import { GroupContextValue, GroupContext } from 'context/group';

import ListContainer from 'containers/list';
import JobDetailContainer from 'ee/containers/jobDetail';
import JobCreatePage from 'ee/containers/jobCreatePage';
import JobListContainer from 'ee/containers/jobList';
import ScheduleDetailContainer from 'ee/containers/scheduleDetail';
import ScheduleCreatePage from 'ee/containers/scheduleCreatePage';
import ScheduleListContainer from 'ee/containers/scheduleList';

const HEADER_HEIGHT = 64;

const Content = styled(Layout.Content)`
  margin-top: ${HEADER_HEIGHT}px;
  padding: 24;
  min-height: calc(100vh - 64px);
`;

export const GroupFragment = gql`
  fragment GroupInfo on Group {
    id
    displayName
    name
  }
`;

export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
      }
    }
  }
  ${GroupFragment}
`

type Props = {
  getMyGroups: any
} & RouteComponentProps;

type State = {
  currentGroupName: string;
};


export class Main extends React.Component<Props, State> {
  state = {
    currentGroupName: ''
  }

  onSelectGroup = (groupName) => {
    const {currentGroupName} = this.state;

    if ( currentGroupName !== groupName) {
      this.setState({
        currentGroupName: groupName
      });
    }
  }

  getGroups(): {
    loading: boolean,
    error: any,
    groups: Array<GroupContextValue>
  } {
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    const {getMyGroups} = this.props;
    const {loading, error, me} = getMyGroups;
    const groups = !loading && !error ?
      me.groups.filter(group => group.id !== everyoneGroupId) :
      undefined;
    return {loading, error, groups};
  }

  render() {
    const {location} = this.props;
    const {currentGroupName} = this.state;
    const {loading, error, groups} = this.getGroups();

    const currentGroup = groups ?
      groups.find(group => group.name === currentGroupName) :
      undefined;

    return (
      <Layout>
        <Switch>
          <Route path={`${appPrefix}g`} exact>
            { groups && groups.length > 0 ?
              <Redirect to={`${appPrefix}g/${groups[0].name}`} /> :
              <Header />
            }
          </Route>
          <Route path={`${appPrefix}g/:groupName`}>
            <Header
              GroupSelectorCom={GroupSelector}
              groupSelectorProps={{
                groups,
                onSelectGroup: this.onSelectGroup
              }}
            />
          </Route>
        </Switch>
        <Layout>
          <Route path={`${appPrefix}g/:groupName`}>
            <Sidebar />
          </Route>
          <Content>
            <GroupContext.Provider value={currentGroup}>
              <Switch>
                <Route path={`${appPrefix}g/:groupName`} exact>
                  <Redirect to={`${location.pathname}/home`} />
                </Route>
                <Route path={`${appPrefix}g/:groupName/job`} exact>
                  <ListContainer Com={JobListContainer} />
                </Route>
                <Route path={`${appPrefix}g/:groupName/job/create`} exact>
                  <JobCreatePage />
                </Route>
                <Route
                  path={`${appPrefix}g/:groupName/job/:jobId`}
                  exact
                  component={JobDetailContainer}
                />
                <Route path={`${appPrefix}g/:groupName/schedule`} exact>
                  <ListContainer Com={ScheduleListContainer} />
                </Route>
                <Route path={`${appPrefix}g/:groupName/schedule/create`} exact>
                  <ScheduleCreatePage />
                </Route>
                <Route
                  path={`${appPrefix}g/:groupName/schedule/:scheduleId`}
                  exact
                  component={ScheduleDetailContainer}
                />
                <Route path={`${appPrefix}g/:groupName/:actionKey`}>
                  <div>{currentGroupName}</div>
                </Route>
              </Switch>
            </GroupContext.Provider>
          </Content>
        </Layout>
      </Layout>
    )
  }
}

export default compose(
  withRouter,
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups',
    options: (props: Props) => ({
      fetchPolicy: 'cache-and-network'
    }),
  })
)(Main)
