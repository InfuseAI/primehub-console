import React from 'react';
import {Icon, Modal, Card, Divider, Tabs, message} from 'antd';
import {find} from 'lodash';
import PageTitle from 'components/pageTitle';
import InfuseButton from 'components/infuseButton';
import {Link} from 'react-router-dom';
import Breadcrumbs from 'components/share/breadcrumb';
import PhApplication, {PhAppStatus} from 'interfaces/phApplication';
import PhAppTemplate from 'interfaces/phAppTemplate';
import AppInformation from 'components/apps/appInfo';
import styled from 'styled-components';
import {AppLogo} from 'components/apps/card';

export const ActionBtn = styled(InfuseButton)`
  margin-right: 8px;
`;

export const ClearBoth = styled.div`
  clear: both;
`;

export const Right = styled.div`
  float: right;
  text-align: right;
`;

export const Left = styled.div`
  float: left;
  text-align: left;
`;

interface Props {
  // stopPhDeployment: Function;
  // stopPhDeploymentResult: any;
  // deletePhDeployment: Function;
  // deletePhDeploymentResult: any;
  // deployPhDeployment: Function;
  // deployPhDeploymentResult: any;
  // createPhDeploymentClient: Function;
  // createPhDeploymentClientResult: any;
  // deletePhDeploymentClient: Function;
  // deletePhDeploymentClientResult: any;
  // refetchPhDeployment: Function;
  phApplication: PhApplication;
  phAppTemplates: PhAppTemplate[];
}

interface State {
  revealEnv: boolean;
}

export default class Detail extends React.Component<Props, State> {
  textArea: React.RefObject<any> = React.createRef();

  copyClipBoard = () => {
    if (this.textArea && this.textArea.current) {
      this.textArea.current.textAreaRef.select();
      document.execCommand('copy');
      message.success('copied');
      this.textArea.current.textAreaRef.blur();
    }
  }

  handleDelete = () => {
    return;
  }

  handleStop = () => {
    return;
  }

  handleDeploy = () => {
    return;
  }

  toggleEnvVisibilty = () => {
    const revealEnv = !this.state.revealEnv;
    this.setState({revealEnv});
  }

  constructor(props) {
    super(props);

    this.state = {
      revealEnv: false
    };
  }

  stopped(): boolean {
    const {phApplication} = this.props;
    return (phApplication.status === PhAppStatus.Stopped || phApplication.status === PhAppStatus.Stopping);
  }

  ready(): boolean {
    const {phApplication} = this.props;
    return (phApplication.status === PhAppStatus.Ready);
  }

  getAppTemplate(id): PhAppTemplate {
    const {phAppTemplates} = this.props;
    return find(phAppTemplates, t => t.id === id);
  }

  renderLogs = () => {
    return <div></div>;
  }

  render() {
    const {phApplication} = this.props;
    const appTemplate = this.getAppTemplate(phApplication.appName);
    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/apps/,
        title: 'Apps',
        link: '/apps?page=1'
      },
      {
        key: 'detail',
        matcher: /\/apps\/([\w-])+/,
        title: `App: ${phApplication.displayName}`
      }
    ];

    return (
      <>
        <PageTitle
          title={`App: ${phApplication.displayName}`}
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        />
        <Card style={{margin: '16px 16px 0'}} >
          <Left>
            <AppLogo style={{marginRight: '8px'}}>
              <img src={phApplication.appIcon}/>
            </AppLogo>
          </Left>
          <h2 style={{margin: '4px 0 0'}}>{phApplication.displayName}</h2>
          <h4 style={{color: '#aaa'}}>{appTemplate.name}, app version: {phApplication.appVersion}</h4>
          <ClearBoth/>
          <div>{appTemplate.description}</div>
          <Divider style={{margin: '8px 0'}}/>
          <div style={{marginBottom: 0}}>
            <Left>
              <ActionBtn href={`${phApplication.appUrl}`} target='_blank'>
                <Icon type='link' /> Open Web UI
              </ActionBtn>
              <ActionBtn href={`${appTemplate.docLink}`} target='_blank'>
                <Icon type='read' /> App Documents
              </ActionBtn>
            </Left>
            <Right>
              {
                this.stopped() ? (
                  <ActionBtn onClick={this.handleDeploy}>
                    <Icon type='play-circle' /> Start
                  </ActionBtn>
                ) : (
                  <ActionBtn onClick={this.handleStop}>
                    <Icon type='stop' /> Stop
                  </ActionBtn>
                )
              }
              {
                <ActionBtn>
                  <Link to={`${phApplication.id}/edit`}>
                    <Icon type='edit' /> Update
                  </Link>
                </ActionBtn>
              }
              <ActionBtn onClick={this.handleDelete} type='danger'>
                <Icon type='delete' /> Delete
              </ActionBtn>
            </Right>
            <ClearBoth/>
          </div>
        </Card>

        <Card style={{margin: '8px 16px'}} >
          <Tabs defaultActiveKey='information'>
            <Tabs.TabPane key='information' tab='Information'>
              {<AppInformation phApplication={phApplication} ready={this.ready()}/>}
            </Tabs.TabPane>
            <Tabs.TabPane key='logs' tab='Logs'>
              {this.renderLogs()}
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </>
    );
  }
}
