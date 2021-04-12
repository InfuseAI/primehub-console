import * as React from 'react';
import {Layout, Alert} from 'antd';
import {Route, Switch, RouteComponentProps} from 'react-router-dom';
import Header from 'components/header';
import GroupSelector from 'components/groupSelector';
import Sidebar from 'components/main/sidebar';
import {get} from 'lodash';
import { Redirect, withRouter } from 'react-router';
import {appPrefix} from 'utils/env';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import { GroupContextValue, GroupContext } from 'context/group';
import { UserContextValue, UserContext } from 'context/user';
import Landing from '../landing';
import ApiTokenPage from 'containers/apiTokenPage';
import {CurrentUser} from 'queries/User.graphql';

export interface MainPageSidebarItem {
  title: string;
  subPath: string;
  icon: string;
  style?: any;
  stage?: string;
  hidden?: boolean;
  groupAdminOnly?: boolean;
}

export type MainPageProps = {
  sidebarItems: MainPageSidebarItem[];
  notification?: React.ReactNode;
  children?: React.ReactNode;
  currentUser: any;
} & RouteComponentProps;

export interface MainPageState {
  currentGroupName: string;
}

export class MainPage extends React.Component<MainPageProps, MainPageState> {
  state = {
    currentGroupName: localStorage.getItem('currentGroupName') || ''
  };

  onSelectGroup = groupName => {
    const {currentGroupName} = this.state;

    if (currentGroupName !== groupName) {
      this.setState({
        currentGroupName: groupName
      });
      window.localStorage.setItem('currentGroupName', groupName);
    }
  }

  checkUserIsGroupAdmin(currentGroup: GroupContextValue, currentUser: UserContextValue): boolean {
    if (!currentUser) {
      return false;
    }
    const admins = get(currentGroup, 'admins', "");
    const adminList = admins ? admins.split(',') : [];
    return adminList.includes(currentUser.username);
  }

  getGroups(): {
    loading: boolean,
    error: any,
    groups: Array<GroupContextValue>,
    me: UserContextValue
  } {
    const everyoneGroupId = window.EVERYONE_GROUP_ID;
    const {currentUser} = this.props;
    const {loading, error, me} = currentUser;
    const groups = !loading && !error && me ?
      me.groups.filter(group => group.id !== everyoneGroupId) :
      undefined;
    return {loading, error, groups, me};
  }

  render() {
    const {sidebarItems, notification, location, children} = this.props;
    const {currentGroupName} = this.state;
    const {loading, error, groups, me} = this.getGroups();
    const currentUser = me;
    const currentGroup = groups ?
      groups.find(group => group.name === currentGroupName) :
      undefined;
    if (currentUser) {
      currentUser.isCurrentGroupAdmin = this.checkUserIsGroupAdmin(currentGroup, currentUser);
    }

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

        <Route path='/'>
          <Redirect to={`${appPrefix}g`} />
        </Route>
      </Switch>;
    }

    return (
      <GroupContext.Provider value={currentGroup}>
      <UserContext.Provider value={currentUser}>
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
              {notification}
              {content}
            </Layout.Content>
          </Layout>
        </Layout>
      </UserContext.Provider>
      </GroupContext.Provider>
    );
  }
}

export default compose(
  withRouter,
  graphql(CurrentUser, {
    alias: 'withCurrentUser',
    name: 'currentUser',
    options: () => ({
      fetchPolicy: 'cache-and-network'
    }),
  })
)(MainPage);
