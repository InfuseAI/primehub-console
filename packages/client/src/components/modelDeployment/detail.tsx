import React from 'react';
import {Icon, Modal, Card, Divider, Row, Col, Tabs, Input, Table} from 'antd';
import { DeploymentInfo, Status } from './common';
import PageTitle from './pageTitle';
import InfuseButton from 'components/infuseButton';
import { appPrefix } from 'utils/env';
import {Link} from 'react-router-dom';
import {Field} from 'components/modelDeployment/card';
import Message from 'components/share/message';
import moment from 'moment';

const {confirm} = Modal;

type Props = {
  stopPhDeployment: Function;
  deletePhDeployment: Function;
  deployPhDeployment: Function;
  stopPhDeploymentResult: any;
  deletePhDeploymentResult: any;
  deployPhDeploymentResult: any;
  phDeployment: DeploymentInfo;
  history: any;
}

export default class Detail extends React.Component<Props> {
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
  
  render() {
    const {phDeployment, stopPhDeploymentResult, deletePhDeploymentResult, deployPhDeploymentResult, history} = this.props;
    return (
      <>
        <PageTitle
          title={(
            <div style={{ display: 'flex', alignItems: 'center'}}>
              <InfuseButton style={{marginRight: 16}} onClick={() => history.push(`${appPrefix}model-deployment`)}>
                <Icon type="arrow-left" />
                Back
              </InfuseButton>
              Deployment: {phDeployment.name}
            </div>
          )}
          extra={<div>
            <InfuseButton onClick={this.handleDelete} style={{marginRight: 16}}>
              Delete
            </InfuseButton>
            {
              (phDeployment.status === Status.failed || phDeployment.status === Status.deployed) ? (
                <InfuseButton onClick={this.handleStop} style={{marginRight: 16}}>
                  Stop
                </InfuseButton>
              ) : (
                <InfuseButton onClick={this.handleDeploy} style={{marginRight: 16}}>
                  Deploy
                </InfuseButton>
              )
            }
            {
              phDeployment.status !== Status.deploying && (
                <InfuseButton>
                  <Link to={`${appPrefix}model-deployment/edit/${phDeployment.id}`}>
                    Update
                  </Link>
                </InfuseButton>
              )
            }
          </div>}
        />
        <Card loading={stopPhDeploymentResult.loading || deletePhDeploymentResult.loading || deployPhDeploymentResult.loading}>
          <Tabs>
            <Tabs.TabPane tab="Information" />
          </Tabs>
          <div style={{padding: '16px 36px'}}>
            <Row>
              <Col span={12}>
                <Field label="Status" value={<strong>{phDeployment.status}</strong>} />
                <Field label="Message" value={getMessage(phDeployment)} />
              </Col>
            </Row>
            <Divider />
            <Row>
              <Col span={12}>
                <Field label="Endpoint" value={phDeployment.status === Status.deployed ? phDeployment.endpoint : '-'} />
                <Field label="Model Image" value={phDeployment.status !== Status.stopped ? phDeployment.modelImage : '-'} />
                <Field label="Replicas" value={phDeployment.replicas} />
                <Field label="Deployment Name" value={phDeployment.name} />
                <Field label="Group" value={phDeployment.groupName} />
                <Field label="Instance Type" value={phDeployment.status !== Status.stopped ? renderInstanceType(phDeployment.instanceType || {}) : '-'} />
                <Field label="Creation Time" value={renderTime(phDeployment.creationTime)} />
                <Field label="Last Updated" value={renderTime(phDeployment.lastUpdatedTime)} />
              </Col>
              <Col span={12}>
                <Field type="vertical" label="Metadata" value={<Metadata metadata={phDeployment.metadata} />} />
                
              </Col>
            </Row>
            <Field style={{marginTop: 32}} type="vertical" label="Description" value={(
              <div style={{whiteSpace: 'pre-line'}}>
                {phDeployment.description}
              </div>
            )} />
            <Field style={{marginTop: 32}} type="vertical" label="Run an Example" value={(
              <Input.TextArea
                style={{
                  background: 'black',
                  color: '#ddd',
                  fontFamily: 'monospace',
                }}
                rows={5}
                value={`curl -X POST \\
  -d '{"data":{"names":["a","b"],"tensor":{"shape":[2,2],"values":[0,0,1,1]}}}' \\
  -H "Content-Type: application/json" \\
  ${phDeployment.endpoint}
                `}
              />
            )} />
          </div>
        </Card>
      </>
    )
  }
}

function Metadata({metadata}: {metadata: object}) {
  const metadataList = Object.keys(metadata || {}).map(key => ({
    key,
    value: metadata[key]
  }));
  const columns = [{
    title: 'Name',
    dataIndex: 'key',
    width: '50%'
  }, {
    title: 'Value',
    dataIndex: 'value',
    width: '50%'
  }];
  return (
    <Table
      style={{border: '1px solid #eee'}}
      columns={columns}
      dataSource={metadataList}
      scroll={{y: 180}}
      size="middle"
      pagination={false}
    />
  )
}

function getMessage(deployment: DeploymentInfo) {
  switch (deployment.status) {
    case Status.deployed:
      return 'Deployment completed';
    case Status.failed:
      return <Message text={deployment.message} />;
    case Status.deploying:
    case Status.stopped:
    default:
      return '-'
  }
}
const dashOrNumber = value => value === null ? '-' : value;

function renderInstanceType(instanceType) {
  return (
    <div>
      {instanceType.displayName || instanceType.name}
      <br />
      (CPU: {dashOrNumber(instanceType.cpuLimit)} / Memory: {dashOrNumber(instanceType.memoryLimit)} G / GPU: {dashOrNumber(instanceType.gpuLimit)})
    </div>
  )
}

function renderTime(time: string) {
  return time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-';
}