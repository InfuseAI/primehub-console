import * as React from 'react';
import {
  Icon,
  Modal,
  Card,
  Divider,
  Row,
  Col,
  Tabs,
  Input,
  Button,
  notification,
} from 'antd';
import { DeploymentInfo, Status, ClientResult } from './common';
import PageTitle from 'components/pageTitle';
import InfuseButton from 'components/infuseButton';
import { Link } from 'react-router-dom';
import Field from 'components/share/field';
import ModelDeploymentLogs from 'ee/components/modelDeployment/logs';
import ModelDeploymentHistory from 'ee/components/modelDeployment/history';
import Metadata from 'ee/components/modelDeployment/metadata';
import EnvList from 'components/share/envList';
import Message from 'components/share/message';
import moment from 'moment';
import ModelDeploymentClients from './client';
import Breadcrumbs from 'components/share/breadcrumb';
import PHTooltip from 'components/share/toolTip';
import { useClipboard } from 'hooks/useClipboard';

const { confirm } = Modal;

interface Props {
  stopPhDeployment: (variables: any) => void;
  stopPhDeploymentResult: any;
  deletePhDeployment: (variables: any) => void;
  deletePhDeploymentResult: any;
  deployPhDeployment: (variables: any) => void;
  deployPhDeploymentResult: any;
  createPhDeploymentClient: (variables: any) => Promise<any>;
  createPhDeploymentClientResult: any;
  deletePhDeploymentClient: (variables: any) => Promise<any>;
  deletePhDeploymentClientResult: any;
  refetchPhDeployment: (variables: any) => void;
  phDeployment: DeploymentInfo;
}

export default function Detail({ phDeployment, ...props }: Props) {
  const [toggleEnvVisible, setToggleEnvVisible] = React.useState(false);
  const [deleteModal, setDeleteModal] = React.useState({
    visible: false,
    deleteable: false,
  });
  const [clientAdded, setClientAdded] = React.useState<ClientResult>({
    name: '',
    plainTextToken: '',
  });

  const example = getExampleCURL(phDeployment);
  const [status, copyExample] = useClipboard({ text: example });

  React.useEffect(() => {
    if (status === 'copied') {
      notification.success({
        message: 'Copied Successfully!',
        placement: 'bottomRight',
      });
    }
  }, [status]);

  function handleRemoveClient(client: string) {
    const where = {
      deploymentId: phDeployment.id,
      name: client,
    };

    props
      .deletePhDeploymentClient({ variables: { where } })
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.error(err);
      });
  }

  function handleAddClient(client: string) {
    const data = {
      deploymentId: phDeployment.id,
      name: client,
    };

    props
      .createPhDeploymentClient({ variables: { data } })
      .then(result => {
        const { data } = result;
        const { name, plainTextToken } = data.createPhDeploymentClient;

        setClientAdded({
          name,
          plainTextToken,
        });
      })
      .catch(err => {
        console.error(err);
      });
  }

  function handleDeploy() {
    confirm({
      title: 'Deploy',
      content: `Do you want to deploy '${phDeployment.name}'?`,
      icon: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      maskClosable: true,
      onOk() {
        return props.deployPhDeployment({
          variables: { where: { id: phDeployment.id } },
        });
      },
    });
  }

  function handleStop() {
    confirm({
      title: 'Stop',
      content: (
        <span>
          Do you want to stop "<b>{phDeployment.name}</b>"?
        </span>
      ),
      icon: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      maskClosable: true,
      onOk() {
        return props.stopPhDeployment({
          variables: { where: { id: phDeployment.id } },
        });
      },
    });
  }

  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/deployments/,
      title: 'Deployments',
      link: '/deployments?page=1',
    },
    {
      key: 'detail',
      matcher: /\/deployments\/([\w-])+/,
      title: `Deployment: ${phDeployment.name}`,
      tips: 'View the detailed information.',
      tipsLink:
        'https://docs.primehub.io/docs/model-deployment-feature#deployment-detail',
    },
  ];

  return (
    <>
      <PageTitle
        title={`Deployment: ${phDeployment.name}`}
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
      />
      <Card
        style={{ margin: '16px 16px' }}
        loading={
          props.stopPhDeploymentResult.loading ||
          props.deletePhDeploymentResult.loading ||
          props.deployPhDeploymentResult.loading
        }
      >
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <InfuseButton
            onClick={() => {
              setDeleteModal(prevState => ({
                ...prevState,
                visible: true,
              }));
            }}
            style={{ marginRight: 16 }}
          >
            Delete
          </InfuseButton>
          {phDeployment.status === Status.Stopped ||
          phDeployment.status === Status.Stopping ? (
            <InfuseButton onClick={handleDeploy} style={{ marginRight: 16 }}>
              Start
            </InfuseButton>
          ) : (
            <InfuseButton onClick={handleStop} style={{ marginRight: 16 }}>
              Stop
            </InfuseButton>
          )}
          {
            <InfuseButton>
              <Link to={`${phDeployment.id}/edit`}>Update</Link>
            </InfuseButton>
          }
          <Modal
            title='Permanently delete deployment?'
            visible={deleteModal.visible}
            okButtonProps={{
              // @ts-ignore
              type: 'danger',
              ghost: true,
              disabled: !deleteModal.deleteable,
            }}
            okText='Delete'
            onOk={() => {
              props.deletePhDeployment({
                variables: { where: { id: phDeployment.id } },
              });
            }}
            onCancel={() => {
              setDeleteModal(prevState => ({
                ...prevState,
                visible: false,
              }));
            }}
          >
            <label htmlFor='delete-deployment'>
              Are you sure you want to <b>permanently</b> delete this
              deployment? It will also be deleted from any other collaborators
              in the group. <br /> Please type <b>{phDeployment.name}</b> to
              confirm this action.
            </label>
            <Input
              id='delete-deployment'
              style={{ marginTop: '1rem' }}
              onChange={event => {
                if (event.currentTarget.value === phDeployment?.name) {
                  setDeleteModal(prevState => ({
                    ...prevState,
                    deleteable: true,
                  }));
                } else {
                  setDeleteModal(prevState => ({
                    ...prevState,
                    deleteable: false,
                  }));
                }
              }}
            />
          </Modal>
        </div>
        <Tabs defaultActiveKey='information'>
          <Tabs.TabPane key='information' tab='Information'>
            <div style={{ padding: '16px 36px' }}>
              <Row gutter={36}>
                <Col span={24}>
                  <Field
                    labelCol={4}
                    valueCol={20}
                    label='Status'
                    value={<strong>{phDeployment.status}</strong>}
                  />
                  <Field
                    labelCol={4}
                    valueCol={20}
                    label='Message'
                    value={getMessage(phDeployment)}
                  />
                  <Field
                    labelCol={4}
                    valueCol={20}
                    label='Endpoint'
                    value={
                      phDeployment.status === Status.Deployed
                        ? phDeployment.endpoint
                        : '-'
                    }
                  />
                  <Field
                    labelCol={4}
                    valueCol={20}
                    label='Creation Time'
                    value={renderTime(phDeployment.creationTime)}
                  />
                  <Field
                    labelCol={4}
                    valueCol={20}
                    label='Last Updated'
                    value={renderTime(phDeployment.lastUpdatedTime)}
                  />
                </Col>
              </Row>
              <Divider />
              <Row gutter={36}>
                <Col span={12}>
                  <Field
                    label='Model Image'
                    value={
                      phDeployment.status !== Status.Stopped
                        ? phDeployment.modelImage
                        : '-'
                    }
                  />
                  <Field
                    label='Image Pull Secret'
                    value={
                      phDeployment.imagePullSecret
                        ? phDeployment.imagePullSecret
                        : '-'
                    }
                  />
                  <Field
                    label='Model URI'
                    value={
                      phDeployment.status !== Status.Stopped &&
                      phDeployment.modelURI
                        ? phDeployment.modelURI
                        : '-'
                    }
                  />
                  <Field
                    label='Description'
                    value={
                      <div style={{ whiteSpace: 'pre-line' }}>
                        {phDeployment.description || '-'}
                      </div>
                    }
                  />
                  <Field
                    label='Instance Type'
                    value={
                      phDeployment.status !== Status.Stopped
                        ? renderInstanceType(phDeployment.instanceType || {})
                        : '-'
                    }
                  />
                  <Field
                    label='Replicas'
                    value={`${phDeployment.availableReplicas || 0}/${
                      phDeployment.replicas
                    }`}
                  />
                  <Field
                    label='Access Type'
                    value={
                      phDeployment.endpointAccessType === 'private'
                        ? 'private'
                        : 'public'
                    }
                  />
                </Col>
                <Col span={12}>
                  <Field
                    type='vertical'
                    label='Metadata'
                    value={<Metadata metadata={phDeployment.metadata} />}
                  />
                  <Field
                    type='vertical'
                    label={
                      <div>
                        Environment Variables{' '}
                        <span
                          onClick={() => setToggleEnvVisible(status => !status)}
                          style={{
                            cursor: 'pointer',
                            verticalAlign: '-0.05em',
                          }}
                        >
                          {toggleEnvVisible ? (
                            <Icon type='eye' title='Hide value' />
                          ) : (
                            <Icon type='eye-invisible' title='Show value' />
                          )}
                        </span>
                      </div>
                    }
                    value={
                      <EnvList
                        envList={phDeployment.env}
                        valueVisibility={toggleEnvVisible}
                      />
                    }
                  />
                </Col>
              </Row>
              <Field
                style={{ marginTop: 32 }}
                type='vertical'
                label={
                  <span>
                    Run an Example{' '}
                    <PHTooltip
                      tipText='Using Curl query sample to test the service; the sample varies according to Public or Private access.'
                      tipLink='https://docs.primehub.io/docs/model-deployment-feature#information'
                      placement='right'
                      style={{ margintLeft: 8 }}
                    />
                  </span>
                }
                value={
                  <>
                    <Button
                      icon='copy'
                      ghost={true}
                      size='small'
                      style={{
                        float: 'right',
                        top: 35,
                        right: 3,
                        marginTop: -32,
                        zIndex: 10,
                        position: 'relative',
                        color: '#ccc',
                        borderColor: '#ccc',
                      }}
                      onClick={copyExample}
                    >
                      Copy
                    </Button>
                    <Input.TextArea
                      style={{
                        background: 'black',
                        color: '#ddd',
                        fontFamily: 'monospace',
                      }}
                      rows={5}
                      value={example}
                    />
                  </>
                }
              />
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane key='logs' tab='Logs'>
            <ModelDeploymentLogs
              refetchPhDeployment={() =>
                props.refetchPhDeployment({ where: { id: phDeployment.id } })
              }
              pods={phDeployment.pods}
            />
          </Tabs.TabPane>
          <Tabs.TabPane key='history' tab='History'>
            <ModelDeploymentHistory history={phDeployment.history} />
          </Tabs.TabPane>
          {phDeployment.endpointAccessType === 'private' && (
            <Tabs.TabPane key='clients' tab='Clients'>
              <ModelDeploymentClients
                clients={phDeployment.endpointClients || []}
                addClient={handleAddClient}
                removeClient={handleRemoveClient}
                clientAdded={clientAdded}
              />
            </Tabs.TabPane>
          )}
        </Tabs>
      </Card>
    </>
  );
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
      return deployment.message ? (
        <Message style={{ marginTop: 0 }} text={deployment.message} />
      ) : (
        '-'
      );
  }
}

const dashOrNumber = value => (value === null ? '-' : value);
const getExampleCURL = ({ endpointAccessType, endpoint }: DeploymentInfo) => {
  return (
    `curl -X POST \\\n` +
    (endpointAccessType === 'private'
      ? `    -u <client-name>:<client-token> \\\n`
      : '') +
    "    -d '${YOUR_DATA}' \\\n" +
    `    -H "Content-Type: application/json" \\\n` +
    `    ${endpoint || '<endpoint>'}`
  );
};

export function renderInstanceType(instanceType) {
  return (
    <div>
      {instanceType.displayName || instanceType.name}
      <br />
      (CPU: {dashOrNumber(instanceType.cpuLimit)} / Memory:{' '}
      {dashOrNumber(instanceType.memoryLimit)} G / GPU:{' '}
      {dashOrNumber(instanceType.gpuLimit)})
    </div>
  );
}

export function renderTime(time: string) {
  return time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-';
}
