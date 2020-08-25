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
import ApiTokenPage from 'containers/apiTokenPage';

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
    const groups = !loading && !error ?
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
          <Layout>
            <Route path={`${appPrefix}g/:groupName`}>
              <Sidebar sidebarItems={sidebarItems}/>
            </Route>
            <Content>
              <Switch>
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
                  <div>{currentGroupName}</div>
                </Route>

                {/* No available groups */}
                <Route path={`${appPrefix}g`} exact>
                  { groups && groups.length > 0 ?
                    <Redirect to={`${appPrefix}g/${groups[0].name}`} /> :
                    <Alert
                      message="No group is available"
                      description="Please contact your administrator to be added to a group."
                      type="warning"
                      showIcon
                    />
                  }
                </Route>
              </Switch>
            </Content>
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
