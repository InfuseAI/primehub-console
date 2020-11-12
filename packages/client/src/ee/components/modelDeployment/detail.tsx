import React from 'react';
import { Icon, Modal, Card, Divider, Row, Col, Tabs, Input, Button, message} from 'antd';
import { DeploymentInfo, Status, ClientResult } from './common';
import PageTitle from 'components/pageTitle';
import DeploymentBreadcrumb from 'ee/components/modelDeployment/breadcrumb';
import InfuseButton from 'components/infuseButton';
import { appPrefix } from 'utils/env';
import {Link} from 'react-router-dom';
import Field from 'components/share/field';
import ModelDeploymentLogs from 'ee/components/modelDeployment/logs';
import ModelDeploymentHistory from 'ee/components/modelDeployment/history';
import Metadata from 'ee/components/modelDeployment/metadata';
import EnvList from 'ee/components/modelDeployment/envList';
import Message from 'components/share/message';
import moment from 'moment';
import ModelDeploymentClients from './client';

const {confirm} = Modal;

type Props = {
  //
  stopPhDeployment: Function;
  stopPhDeploymentResult: any;
  //
  deletePhDeployment: Function;
  deletePhDeploymentResult: any;
  //
  deployPhDeployment: Function;
  deployPhDeploymentResult: any;
  //
  createPhDeploymentClient: Function;
  createPhDeploymentClientResult: any;
  //
  deletePhDeploymentClient: Function;
  deletePhDeploymentClientResult: any;
  //
  refetchPhDeployment: Function;
  phDeployment: DeploymentInfo;
  history: any;
}

type State = {
  clientAdded: ClientResult;
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
    const {phDeployment, deletePhDeployment} = this.props;
    confirm({
      title: `Delete`,
      content: `Do you want to delete '${phDeployment.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return deletePhDeployment({variables: {where: {id: phDeployment.id}}});
      },
    });
  }

  handleStop = () => {
    const {phDeployment, stopPhDeployment} = this.props;
    confirm({
      title: `Stop`,
      content: `Do you want to stop '${phDeployment.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return stopPhDeployment({variables: {where: {id: phDeployment.id}}});
      },
    });
  }

  handleDeploy = () => {
    const {phDeployment, deployPhDeployment} = this.props;
    confirm({
      title: `Deploy`,
      content: `Do you want to deploy '${phDeployment.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        return deployPhDeployment({variables: {where: {id: phDeployment.id}}});
      },
    });
  }

  handleAddClient = (client: string) => {
    const {phDeployment, createPhDeploymentClient} = this.props;
    const data = {
      deploymentId: phDeployment.id,
      name: client
    };

    createPhDeploymentClient({variables: {data}})
    .then((result) => {
      const {data} = result;
      const {name, plainTextToken} = data.createPhDeploymentClient;

      this.setState({
        clientAdded: {
          name,
          plainTextToken,
        }
      });
    });
  }

  handleRemoveClient = (client: string) => {
    const {phDeployment, deletePhDeploymentClient} = this.props;
    const where = {
      deploymentId: phDeployment.id,
      name: client
    };

    deletePhDeploymentClient({variables: {where}})
    .then((result) => {
      console.log(result);
    });
  }

  toggleEnvVisibilty = () => {
    const revealEnv = !this.state.revealEnv;
    this.setState({revealEnv});
  }

  constructor(props) {
    super(props);

    this.state = {
      clientAdded: null,
      revealEnv: false
    };
  }

  renderInformation = () => {
    const {revealEnv} = this.state;
    const {phDeployment} = this.props;
    const example = `curl -X POST \\\n` +
    (phDeployment.endpointAccessType === 'private' ?
    `    -u <client-name>:<client-token> \\\n` : "") +
    `    -d '{"data":{"names":["a","b"],"tensor":{"shape":[2,2],"values":[0,0,1,1]}}}' \\\n`+
    `    -H "Content-Type: application/json" \\\n` +
    `    ${phDeployment.endpoint || '<endpoint>'}`;
    const revealBtn = (
      <span onClick={this.toggleEnvVisibilty} style={{cursor: 'pointer', verticalAlign: '-0.05em'}}>
      { revealEnv ? <Icon type="eye" title='Hide value' /> : <Icon type="eye-invisible" title="Show value" /> }
      </span>
    )

    return (
      <div style={{padding: '16px 36px'}}>
        <Row gutter={36}>
          <Col span={24}>
            <Field labelCol={4} valueCol={20} label="Status" value={<strong>{phDeployment.status}</strong>} />
            <Field labelCol={4} valueCol={20} label="Message" value={getMessage(phDeployment)} />
            <Field labelCol={4} valueCol={20} label="Creation Time" value={renderTime(phDeployment.creationTime)} />
            <Field labelCol={4} valueCol={20} label="Last Updated" value={renderTime(phDeployment.lastUpdatedTime)} />
          </Col>
        </Row>
        <Divider />
        <Row gutter={36}>
          <Col span={12}>
            <Field label="Model Image" value={phDeployment.status !== Status.Stopped ? phDeployment.modelImage : '-'} />
            <Field label="Image Pull Secret" value={phDeployment.imagePullSecret ? phDeployment.imagePullSecret : '-'} />
            <Field label="Description" value={(
              <div style={{whiteSpace: 'pre-line'}}>
                {phDeployment.description || '-'}
              </div>
            )} />
            <Field label="Instance Type" value={phDeployment.status !== Status.Stopped ? renderInstanceType(phDeployment.instanceType || {}) : '-'} />
            <Field label="Replicas" value={`${(phDeployment.availableReplicas || 0)}/${phDeployment.replicas}`} />
            <Field label="Access Type" value={phDeployment.endpointAccessType === 'private' ? 'private' : 'public'} />
          </Col>
          <Col span={12}>
            <Field type="vertical" label="Metadata" value={<Metadata metadata={phDeployment.metadata} />} />
            <Field type="vertical" label={<span>Environment Variables {revealBtn}</span>} value={<EnvList envList={phDeployment.env} valueVisibility={revealEnv} />} />
          </Col>
        </Row>
        <Field style={{marginTop: 32}} type="vertical" label="Run an Example" value={(
          <>
            <Button icon="copy" onClick={() => this.copyClipBoard()}
              style={{
                float: 'right',
                top: 32,
                marginTop: -32,
                zIndex: 10,
                position: 'relative',
                color: '#ccc',
                borderColor: '#ccc'
              }}
              type="ghost"
            >
              Copy
            </Button>
            <Input.TextArea
              ref={this.textArea}
              style={{
                background: 'black',
                color: '#ddd',
                fontFamily: 'monospace',
              }}
              rows={5}
              value={example}
            />
          </>
        )} />
      </div>
    )
  }

  renderLogs = () => {
    const {phDeployment, refetchPhDeployment} = this.props;
    return <ModelDeploymentLogs
      refetchPhDeployment={() => refetchPhDeployment({where: {id: phDeployment.id}})}
      pods={phDeployment.pods}
    />;
  }

  renderHistory = () => {
    const {phDeployment} = this.props;
    return <ModelDeploymentHistory history={phDeployment.history}/>;
  }

  renderClients = () => {
    const {phDeployment} = this.props;
    const clients = phDeployment.endpointClients || [];
    const {clientAdded} = this.state;
    return <ModelDeploymentClients
      clients={clients}
      addClient={this.handleAddClient}
      removeClient={this.handleRemoveClient}
      clientAdded={clientAdded}
    />;
  }

  render() {
    const {phDeployment, stopPhDeploymentResult, deletePhDeploymentResult, deployPhDeploymentResult, history} = this.props;
    return (
      <>
        <PageTitle
          title={`Deployment: ${phDeployment.name}`}
          breadcrumb={<DeploymentBreadcrumb deploymentName={phDeployment.name} />}
        />
        <Card style={{margin: '16px 16px'}} loading={stopPhDeploymentResult.loading || deletePhDeploymentResult.loading || deployPhDeploymentResult.loading}>
          <div style={{marginBottom: 16, textAlign: 'right'}}>
            <InfuseButton onClick={this.handleDelete} style={{marginRight: 16}}>
              Delete
            </InfuseButton>
            {
              (phDeployment.status === Status.Stopped || phDeployment.status === Status.Stopping) ? (
                <InfuseButton onClick={this.handleDeploy} style={{marginRight: 16}}>
                  Start
                </InfuseButton>
              ):(
                <InfuseButton onClick={this.handleStop} style={{marginRight: 16}}>
                  Stop
                </InfuseButton>
              )
            }
            {
              <InfuseButton>
                <Link to={`${phDeployment.id}/edit`}>
                  Update
                </Link>
              </InfuseButton>
            }
          </div>
          <Tabs defaultActiveKey="information">
            <Tabs.TabPane key="information" tab="Information">
              {this.renderInformation()}
            </Tabs.TabPane>
            <Tabs.TabPane key="logs" tab="Logs">
              {this.renderLogs()}
            </Tabs.TabPane>
            <Tabs.TabPane key="history" tab="History">
              {this.renderHistory()}
            </Tabs.TabPane>
            {phDeployment.endpointAccessType === 'private'
              ? <Tabs.TabPane key="clients" tab="Clients">
                  {this.renderClients()}
                </Tabs.TabPane>
              : <></>
            }
          </Tabs>
        </Card>
      </>
    )
  }
}

function getMessage(deployment: DeploymentInfo) {
  switch (deployment.status) {
    case Status.Deployed:
      return 'Deployment completed';
    case Status.Failed:
    case Status.Stopping:
    case Status.Deploying:
    case Status.Stopped:
    default:
      return deployment.message ? <Message style={{marginTop: 0}} text={deployment.message} /> : '-';
  }
}
const dashOrNumber = value => value === null ? '-' : value;

export function renderInstanceType(instanceType) {
  return (
    <div>
      {instanceType.displayName || instanceType.name}
      <br />
      (CPU: {dashOrNumber(instanceType.cpuLimit)} / Memory: {dashOrNumber(instanceType.memoryLimit)} G / GPU: {dashOrNumber(instanceType.gpuLimit)})
    </div>
  )
}

export function renderTime(time: string) {
  return time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-';
}
