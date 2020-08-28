import * as React from 'react';
import {Layout, Alert} from 'antd';
import {Route, Switch, RouteComponentProps} from 'react-router-dom';
import Header from 'components/header';
import GroupSelector from 'components/groupSelector';
import Sidebar from 'components/main/sidebar';
import styled from 'styled-components';
import { Redirect } from 'react-router';
import {appPrefix} from 'utils/env';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {withRouter} from 'react-router';
import { GroupContextValue, GroupContext } from 'context/group';
import { Landing } from '../landing';
import ApiTokenPage from 'containers/apiTokenPage';

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
export type MainPageSidebarItem = {
  title: string;
  subPath: string;
  icon: string;
  style?: any;
  stage?: string;
}

export type MainPageProps = {
  sidebarItems: MainPageSidebarItem[];
  children?: React.ReactNode;
  getMyGroups: any;
} & RouteComponentProps;

export type MainPageState = {
  currentGroupName: string;
};

export class MainPage extends React.Component<MainPageProps, MainPageState> {
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
    const groups = !loading && !error && me ?
      me.groups.filter(group => group.id !== everyoneGroupId) :
      undefined;
    return {loading, error, groups};
  }

  render() {
    const {sidebarItems, location, children} = this.props;
    const {currentGroupName} = this.state;
    const {loading, error, groups} = this.getGroups();

    const currentGroup = groups ?
      groups.find(group => group.name === currentGroupName) :
      undefined;

    let content;

    if (loading) {
      content = <></>
    } else if (error) {
      content = <Switch>
        <Route path={`${appPrefix}g`} exact>
          <Alert
            message='Failed to retrieve data'
            description='Please contact your administrator.'
            type='error'
            showIcon
          />
        </Route>
        <Route path='/'>
          <Redirect to={`${appPrefix}g`} />
        </Route>
      </Switch>
    } else if (groups && groups.length === 0) {
      content = <Switch>
        <Route path={`${appPrefix}g`} exact>
          <Alert
            message='No group is available'
            description='Please contact your administrator to be added to a group.'
            type='warning'
            showIcon
          />
        </Route>
        <Route path='/'>
          <Redirect to={`${appPrefix}g`} />
        </Route>
      </Switch>
    } else {
      content = <Switch>
        {/* Home */}
        <Route path={`${appPrefix}g/:groupName`} exact>
          <Redirect to={`${location.pathname}/home`} />
        </Route>

        {/* API Token */}
        <Route path={`${appPrefix}g/:groupName/api-token`} exact>
          <ApiTokenPage />
        </Route>

        {/* Extra routing */}
        {children}

        {/* Default */}
        <Route path={`${appPrefix}g/:groupName/:actionKey`}>
          <Landing includeHeader={false} />
        </Route>
      </Switch>;
    }

    return (
      <GroupContext.Provider value={currentGroup}>
        <Layout>
          <Switch>
            <Route path={`${appPrefix}g`} exact>
              <Header
                GroupSelectorCom={GroupSelector}
                groupSelectorProps={{
                  groups,
                  onSelectGroup: this.onSelectGroup
                }}
              />
            </Route>
            <Route path={`${appPrefix}g/:groupName`} exact>
              <Header
                GroupSelectorCom={GroupSelector}
                groupSelectorProps={{
                  groups,
                  onSelectGroup: this.onSelectGroup
                }}
              />
            </Route>
            <Route path={`${appPrefix}g/:groupName/:subPath`}>
              <Header
                GroupSelectorCom={GroupSelector}
                groupSelectorProps={{
                  groups,
                  onSelectGroup: this.onSelectGroup
                }}
              />
            </Route>
          </Switch>
          <Layout style={{marginTop: 64}}>
            <Route path={`${appPrefix}g/:groupName`}>
              <Sidebar sidebarItems={sidebarItems}/>
            </Route>
            <Layout.Content style={{marginLeft: 200,  minHeight: 'calc(100vh - 64px)'}}>
              {content}
            </Layout.Content>
          </Layout>
        </Layout>
      </GroupContext.Provider>
    )
  }
}

export default compose(
  withRouter,
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups',
    options: (props: any) => ({
      fetchPolicy: 'cache-and-network'
    }),
  })
)(MainPage)
