import React from 'react';
import {Icon, Modal, Card, Divider, Tabs, message} from 'antd';
import {find, get} from 'lodash';
import PageTitle from 'components/pageTitle';
import Log from 'components/share/log';
import InfuseButton from 'components/infuseButton';
import {Link} from 'react-router-dom';
import Breadcrumbs from 'components/share/breadcrumb';
import PhApplication, {PhAppStatus} from 'interfaces/phApplication';
import PhAppTemplate from 'interfaces/phAppTemplate';
import AppInformation from 'components/apps/appInfo';
import styled from 'styled-components';
import AppLogo from 'components/apps/appLogo';

const {confirm} = Modal;

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
  deleteApp: ({}) => void;
  startApp: ({}) => void;
  stopApp: ({}) => void;
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
    const {phApplication, deleteApp} = this.props;
    confirm({
      title: `Uninstall App`,
      content: <span>Do you really want to uninstall "<b>{phApplication.displayName}</b>"?</span>,
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return deleteApp({variables: {where: {id: phApplication.id}}});
      },
    });
  }

  handleStop = () => {
    const {phApplication, stopApp} = this.props;
    confirm({
      title: `Stop App`,
      content: <span>Do you want to stop "<b>{phApplication.displayName}</b>"?</span>,
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return stopApp({variables: {where: {id: phApplication.id}}});
      },
    });
  }

  handleStart = () => {
    const {phApplication, startApp} = this.props;
    confirm({
      title: `Start App`,
      content: <span>Do you want to start "<b>{phApplication.displayName}</b>"?</span>,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        return startApp({variables: {where: {id: phApplication.id}}});
      },
    });
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

  renderLogs = () => {
    const {phApplication} = this.props;
    const logEndpoint = get(phApplication, 'pods[0].logEndpoint', '');
    return <Log endpoint={logEndpoint} />
;
  }

  render() {
    const {phApplication} = this.props;
    const appTemplate = phApplication.appTemplate;
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
        title: `App: ${phApplication.displayName}`,
        tips: 'View the detailed information of the application instance.',
        tipsLink: 'https://docs.primehub.io/docs/primehub-app#installed-app-detail'
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
            <AppLogo style={{marginRight: '8px'}} src={phApplication.appIcon}/>
          </Left>
          <h2 style={{margin: '4px 0 0'}}>{phApplication.displayName}</h2>
          <h4 style={{color: '#aaa'}}>{appTemplate.name}, app version: {phApplication.appVersion}</h4>
          <ClearBoth/>
          <div>{appTemplate.description}</div>
          <Divider style={{margin: '8px 0'}}/>
          <div style={{marginBottom: 0}}>
            <Left>
              <ActionBtn type='primary' href={`${phApplication.appUrl}`} target='_blank'>
                <Icon type='link' /> Open Web UI
              </ActionBtn>
              <ActionBtn href={`${appTemplate.docLink}`} target='_blank'>
                <Icon type='read' /> App Documents
              </ActionBtn>
            </Left>
            <Right>
              {
                this.stopped() ? (
                  <ActionBtn onClick={this.handleStart}>
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
                <Icon type='delete' /> Uninstall
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
