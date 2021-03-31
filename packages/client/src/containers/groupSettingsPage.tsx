import * as React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get, isNull } from 'lodash';
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

type Props = {
  getGroups: any;
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

export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
      }
    }
  }
  fragment GroupInfo on Group {
    id
    name
    displayName
    enabledSharedVolume
    quotaCpu
    quotaGpu
    quotaMemory
    projectQuotaCpu
    projectQuotaGpu
    projectQuotaMemory
    admins
    users {
      username
    }
    jobDefaultActiveDeadlineSeconds
    enabledDeployment
  }
`

class GroupSettingsPage extends React.Component<Props> {

  render() {
    const {groupContext, userContext, getGroups, history, extraTabs} = this.props;
    if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)) {
      history.push(`../home`);
    }

    const group = get(getGroups, 'me.groups', []).find(group => group.id === groupContext.id);

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={"Settings"}
        />
        <PageBody style={{flex: '1 1 0%'}}>
          <Tabs style={{height: '100%'}}>
            <Tabs.TabPane key="info" tab="Info">
              <GroupSettingsAlert />
              <GroupSettingsInfo group={group} />
            </Tabs.TabPane>
            <Tabs.TabPane key="members" tab="Members">
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
  graphql(GET_MY_GROUPS, {
    name: 'getGroups'
  }),
)(GroupSettingsPage)
