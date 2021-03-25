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

const inputNumberStyle = {
  width: 193,
};

const checkboxStyle = {
  marginRight: 8,
};

class GroupSettingsPage extends React.Component<Props> {

  renderInfoQuotaFormItem(title, value, params) {
    return (
      <Form.Item label={title} >
        <div style={{alignItems: 'center'}}>
          <Checkbox style={checkboxStyle} checked={!isNull(value)} disabled />
          {
            isNull(value) ? (
              <Input style={inputNumberStyle}
                value={'unlimited'}
                disabled />
            ) : (
              <InputNumber style={inputNumberStyle}
                min={params && params.min}
                step={params && params.step}
                precision={params && params.precision}
                formatter={value => `${value}${params && params.unit ? params.unit : ''}`}
                value={value}
                disabled />
            )
          }
        </div>
      </Form.Item>
    );
  }

  renderInfoQuotaCard(title: string, quota) {
    return (
      <Card title={title}>
        <Row>
          <Col sm={8} xs={24}>
            {this.renderInfoQuotaFormItem('CPU Quota', quota.cpu, {min: 0.5, step: 0.5, percision: 1})}
          </Col>
          <Col sm={8} xs={24}>
            {this.renderInfoQuotaFormItem('GPU Quota', quota.gpu, {min: 0, step: 1, percision: 0})}
          </Col>
          <Col sm={8} xs={24}>
            {this.renderInfoQuotaFormItem('Memory Quota', quota.memory, {min: 0, step: 1, precision: 1, unit: ' GB'})}
          </Col>
        </Row>
      </Card>
    );
  }

  renderInfoPage(group: any) {
    if (!group) {
      return (<div>loading...</div>);
    }

    return (
      <>
        <Row style={{marginTop: 5}}>
          <Col>
            <Form.Item label={`Name`} style={{marginBottom: 20}}>
              <Input disabled value={group.name} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`Display Name`} style={{marginBottom: 20}}>
              <Input disabled value={group.displayName} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`Shared Volume`} style={{marginBottom: 20}}>
              <Switch disabled checked={group.enabledSharedVolume} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            {
              this.renderInfoQuotaCard('User Quota', {
                cpu: group.quotaCpu,
                gpu: group.quotaGpu,
                memory: group.quotaMemory,
              })
            }
          </Col>
        </Row>
        <Row style={{marginTop: 20, marginBottom: 5}}>
          <Col>
            {
              this.renderInfoQuotaCard('Group Quota', {
                cpu: group.projectQuotaCpu,
                gpu: group.projectQuotaGpu,
                memory: group.projectQuotaMemory,
              })
            }
          </Col>
        </Row>
      </>
    );
  }

  renderMembersPage(group: any) {
    if (!group) {
      return (<div>loading...</div>);
    }

    const admins = get(group, 'admins', []).split(',');
    const users = get(group, 'users', []).map(user => {
      return {
        username: user.username,
        admin: admins.includes(user.username),
      };
    });

    const columns = [
      {
        title: 'Username',
        dataIndex: 'username',
        key: 'username',
      },
      {
        title: 'Group Admin',
        dataIndex: 'admin',
        key: 'admin',
        render: (value) => <Checkbox checked={value} disabled />,
      },
    ];

    return <Table dataSource={users} columns={columns} style={{marginTop: 15}}/>;
  }

  renderAlert() {
    return <Alert
             message='Only system admins can update these settings'
             description='Please contact your administrator to configure these settings.'
             type='warning'
             showIcon />;
  }

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
              {this.renderAlert()}
              {this.renderInfoPage(group)}
            </Tabs.TabPane>
            <Tabs.TabPane key="members" tab="Members">
              {this.renderAlert()}
              {this.renderMembersPage(group)}
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
