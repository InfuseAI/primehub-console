import * as React from 'react';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get } from 'lodash';
import { Form, Tabs, Row, Col, Card, Switch, Checkbox, Input, InputNumber, Table, Alert } from 'antd';
import { RouteComponentProps } from 'react-router-dom';
import { withRouter } from 'react-router';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import { withUserContext, UserContextComponentProps } from 'context/user';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import GroupSettingsInfo from 'components/groupSettings/info';
import GroupSettingsMembers from 'components/groupSettings/members';
import GroupSettingsAlert from 'components/groupSettings/alert';
import {CurrentUser} from 'queries/User.graphql';

type Props = {
  currentUser: any;
  extraTabs: React.Component[];
} & GroupContextComponentProps & UserContextComponentProps & RouteComponentProps;

const breadcrumbs = [
  {
    key: 'settings',
    matcher: /\/settings/,
    title: 'Settings',
    link: '/settings',
  }
];

class GroupSettingsPage extends React.Component<Props> {

  render() {
    const {groupContext, userContext, currentUser, history, extraTabs} = this.props;
    if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)) {
      history.push(`../home`);
    }

    const group = get(currentUser, 'me.groups', []).find(g => g.id === groupContext.id);

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Settings'}
        />
        <PageBody style={{flex: '1 1 0%'}}>
          <Tabs style={{height: '100%'}}>
            <Tabs.TabPane key='info' tab='Information'>
              <GroupSettingsAlert />
              <GroupSettingsInfo group={group} />
            </Tabs.TabPane>
            <Tabs.TabPane key='members' tab='Members'>
              <GroupSettingsAlert />
              <GroupSettingsMembers group={group} />
            </Tabs.TabPane>
            {
              extraTabs && extraTabs.length ? extraTabs.map((t: any) => {
                const Component = t.component;
                return <Tabs.TabPane key={t.key} tab={t.tab}><Component {...this.props}/></Tabs.TabPane>;
              }) : []
            }
          </Tabs>
        </PageBody>
      </>
    );
  }
}

export default compose(
  withRouter,
  withUserContext,
  withGroupContext,
  graphql(CurrentUser, {
    name: 'currentUser',
    alias: 'withCurrentUser'
  }),
)(GroupSettingsPage);
