import React from 'react';
import {Tag, Icon, Row, Col, Divider} from 'antd';
import Field from 'components/share/field';
import PhApplication, {PhAppStatus, PhAppScope} from 'interfaces/phApplication';
import InstanceTypeField from 'components/share/instanceTypeField';
import EnvList from 'components/share/envList';

interface Props {
  phApplication: PhApplication;
  ready: boolean;
}

interface State {
  revealEnv: boolean;
}

export default class AppInformation extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      revealEnv: false
    };
  }

  toggleEnvVisibilty = () => {
    const revealEnv = !this.state.revealEnv;
    this.setState({revealEnv});
  }

  translateScope(scope: PhAppScope) {
    const mapping = {};
    mapping[PhAppScope.Public] = 'Public';
    mapping[PhAppScope.PrimeHubUserOnly] = 'Primehub User Only';
    mapping[PhAppScope.GroupOnly] = 'Group Only';
    return mapping[scope];
  }

  renderStatusColor(status: PhAppStatus) {
    switch (status) {
      case PhAppStatus.Ready:
        return 'green';
      case PhAppStatus.Stopping:
      case PhAppStatus.Updating:
      case PhAppStatus.Starting:
        return 'orange';
      case PhAppStatus.Error:
        return 'red';
      case PhAppStatus.Stopped:
      default:
        return '#aaa';
    }
  }

  render() {
    const {revealEnv} = this.state;
    const {phApplication, ready} = this.props;
    const revealBtn = (
      <span onClick={this.toggleEnvVisibilty} style={{cursor: 'pointer', verticalAlign: '-0.05em'}}>
      { revealEnv ? <Icon type='eye' title='Hide value' /> : <Icon type='eye-invisible' title='Show value' /> }
      </span>
    );
    return (
      <div style={{padding: '16px 36px'}}>
        <Row gutter={36}>
          <Col span={24}>
            <Field labelCol={4} valueCol={20} label='Status' value={<Tag color={this.renderStatusColor(phApplication.status)}>{phApplication.status}</Tag>} />
            <Field labelCol={4} valueCol={20} label='Message' value={phApplication.message} />
            <Field labelCol={4} valueCol={20} label='App URL' value={ready ? phApplication.appUrl : '-'} />
            <Field labelCol={4} valueCol={20} label='Service Endpoint' value={phApplication.svcEndpoint} />
          </Col>
        </Row>
        <Divider />
        <Row gutter={36}>
          <Col span={24}>
            <Field labelCol={4} valueCol={20} label='App ID' value={phApplication.id} />
            <Field labelCol={4} valueCol={20} label='Name' value={phApplication.displayName} />
            <Field labelCol={4} valueCol={20} label='App' value={phApplication.appName} />
            <Field labelCol={4} valueCol={20} label='Instance Type' value={phApplication.status !== PhAppStatus.Stopped ? <InstanceTypeField instanceType={phApplication.instanceType || {}}/> : '-'} />
            <Field labelCol={4} valueCol={20} label='Access Scope' value={this.translateScope(phApplication.scope)} />
            <Field type='vertical'
              label={<span>Environment Variables {revealBtn}</span>}
              value={<EnvList envList={phApplication.env} valueVisibility={revealEnv} />}
              valueStyle={{maxWidth: 800}}
            />
          </Col>
        </Row>
      </div>
    );
  }
}
