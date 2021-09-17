import React, { useState, useEffect } from 'react';
import { graphql } from 'react-apollo';
import { get, pick } from 'lodash';
import { compose } from 'recompose';
import { Link } from 'react-router-dom';
import { Skeleton, Select, notification, Form, Row, Col, Input } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import InfuseButton from 'components/infuseButton';
import EnvFields from 'components/share/envFields';
import { errorHandler } from 'utils/errorHandler';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import PHTooltip from 'components/share/toolTip';
import Feature from 'components/share/feature';
import {
  UpdateGroupMLflowConfig,
  GetGroupMLflowConfig,
} from 'queries/Group.graphql';
import { PhApplicationsConnection } from 'queries/PhApplication.graphql';
import Env from 'interfaces/env';

const { Option } = Select;
const CUSTOM = 'custom';
const EMPTY = '';

type MLflowConfigProps = {
  updateGroupMLflowConfig: any;
  getGroupMLflowConfig: any;
  getPhApplicationConnection: any;
} & GroupContextComponentProps &
  FormComponentProps;

interface MLflowConfigState {
  mlDisableEdit: boolean;
  init: boolean;
}

interface FormValue {
  trackingUri: string;
  uiUrl: string;
  trackingEnvs: Env[];
  artifactEnvs: Env[];
}

interface SelectorProps extends GroupContextComponentProps {
  getPhApplicationConnection: any;
  onChange: (value: string) => void;
  currentConfig: string;
}

const SetupSelector = compose(withGroupContext)((props: SelectorProps) => {
  const { getPhApplicationConnection, groupContext, currentConfig, onChange } =
    props;
  if (getPhApplicationConnection.loading)
    return <Skeleton paragraph={{ rows: 1 }} active />;
  const mlflowApps = get(
    getPhApplicationConnection,
    'phApplicationsConnection.edges',
    []
  );
  const appList = mlflowApps.map(a => a.node);
  const optDict = appList.reduce((acc, app) => {
    const firstSvcEndpoint = `http://${get(app, 'svcEndpoints[0]', '')}`;
    const optValue = `${firstSvcEndpoint},${app.appUrl}`;
    acc[optValue] = app.id;
    return acc;
  }, {});
  const [disabled, setDisabled] = useState(appList.length <= 0);
  const [matched, setMatched] = useState(false);
  const [matchedId, setMatchedId] = useState('');
  const [selected, setSelected] = useState(
    optDict[currentConfig] ? currentConfig : CUSTOM
  );

  useEffect(() => {
    setDisabled(appList.length <= 0);
  }, [appList]);
  useEffect(() => {
    if (optDict[selected]) {
      setMatched(true);
      setMatchedId(optDict[selected]);
    } else {
      setMatched(false);
      setMatchedId(EMPTY);
    }
  }, [optDict, selected]);

  const optElements = appList.map(app => {
    const firstSvcEndpoint = `http://${get(app, 'svcEndpoints[0]', '')}`;
    const optValue = `${firstSvcEndpoint},${app.appUrl}`;
    return (
      <Option key={app.id} value={optValue}>
        {app.displayName}
      </Option>
    );
  });

  const handleChange = value => {
    if (value) {
      setSelected(value);
      onChange(value);
    }
  };

  return (
    <Skeleton
      key={`selector-${groupContext.id}`}
      active
      loading={getPhApplicationConnection.loading}
    >
      <Select
        placeholder={disabled ? 'Not Available' : 'Select MLflow Apps'}
        style={{ width: 260, marginRight: 20 }}
        disabled={disabled}
        onChange={handleChange}
        value={disabled ? undefined : selected}
      >
        {optElements}
        <Option key='CUSTOM' value={CUSTOM}>
          Custom
        </Option>
      </Select>
      {disabled ? (
        <Link to='apps/create/mlflow'>Create MLflow App</Link>
      ) : (
        <></>
      )}
      {matched ? (
        <Link to={`apps/${matchedId}`}>Check App Settings</Link>
      ) : (
        <></>
      )}
    </Skeleton>
  );
});

class GroupSettingsMLflow extends React.Component<
  MLflowConfigProps,
  MLflowConfigState
> {
  state = {
    mlDisableEdit: false,
    init: true,
  };

  trackingEnvsTips = (
    <PHTooltip
      placement='right'
      tipText='This is used to access the MLflow tracking server'
      tipLink='https://www.mlflow.org/docs/latest/tracking.html#logging-to-a-tracking-server'
    />
  );

  artifactEnvsTips = (
    <PHTooltip
      placement='right'
      tipText='This is used to access the MLflow artifact stores'
      tipLink='https://www.mlflow.org/docs/latest/tracking.html#artifact-stores'
    />
  );

  mlflowAppSelectorTips = (
    <PHTooltip
      placement='right'
      tipText='You can setup a MLflow application in PrimeHub Apps to configure MLflow settings.'
      tipLink='https://docs.primehub.io/docs/model-configuration'
    />
  );

  onSubmit = e => {
    const { updateGroupMLflowConfig, groupContext, form } = this.props;
    e.preventDefault();
    form.validateFields(async (err, values: FormValue) => {
      if (err) return;
      updateGroupMLflowConfig({
        variables: {
          where: { id: groupContext.id },
          data: pick(values, [
            'trackingUri',
            'uiUrl',
            'trackingEnvs',
            'artifactEnvs',
          ]),
        },
      });
    });
  };

  handleMLflowSetupChange = value => {
    const { form } = this.props;
    if (value) {
      if (value !== CUSTOM) {
        const [trackingUri, uiUrl] = value.split(',');
        form.setFieldsValue({
          trackingUri,
          uiUrl,
        });
        this.setState({
          mlDisableEdit: true,
          init: false,
        });
      } else {
        form.setFieldsValue({
          trackingUri: '',
          uiUrl: '',
        });
        this.setState({
          mlDisableEdit: false,
          init: false,
        });
      }
    }
  };

  render() {
    const { getGroupMLflowConfig, getPhApplicationConnection, form } =
      this.props;
    if (!getGroupMLflowConfig.group) return null;
    const mlflowApps = get(
      getPhApplicationConnection,
      'phApplicationsConnection.edges',
      []
    );
    const appList = mlflowApps.map(a => a.node);
    const optDict = appList.reduce((acc, app) => {
      const firstSvcEndpoint = `http://${get(app, 'svcEndpoints[0]', '')}`;
      const optValue = `${firstSvcEndpoint},${app.appUrl}`;
      acc[optValue] = app.id;
      return acc;
    }, {});
    const groupMLflowConfig = get(getGroupMLflowConfig, 'group.mlflow', {});
    const currentConfig = `${groupMLflowConfig.trackingUri},${groupMLflowConfig.uiUrl}`;
    return (
      <Skeleton
        active
        paragraph={{ rows: 17 }}
        loading={getGroupMLflowConfig.loading}
      >
        <Form onSubmit={this.onSubmit}>
          <Feature modelDeploy={false}>
            <Row style={{ marginTop: 5 }}>
              <Col>
                <Form.Item
                  label={
                    <span>
                      Configure with Installed Apps {this.mlflowAppSelectorTips}
                    </span>
                  }
                  style={{ marginBottom: 20 }}
                >
                  <SetupSelector
                    onChange={this.handleMLflowSetupChange}
                    getPhApplicationConnection={getPhApplicationConnection}
                    currentConfig={currentConfig}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Feature>
          <Row style={{ marginTop: 5 }}>
            <Col>
              <Form.Item
                label={`MLflow Tracking URI`}
                style={{ marginBottom: 20 }}
              >
                {form.getFieldDecorator('trackingUri', {
                  initialValue: groupMLflowConfig.trackingUri,
                  rules: [{ required: true }],
                })(
                  <Input
                    disabled={
                      this.state.mlDisableEdit ||
                      (this.state.init && optDict[currentConfig])
                    }
                  />
                )}
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Item label={`MLflow UI URI`} style={{ marginBottom: 20 }}>
                {form.getFieldDecorator('uiUrl', {
                  initialValue: groupMLflowConfig.uiUrl,
                })(
                  <Input
                    disabled={
                      this.state.mlDisableEdit ||
                      (this.state.init && optDict[currentConfig])
                    }
                  />
                )}
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Item
                label={
                  <span>
                    Tracking Environment Variables {this.trackingEnvsTips}
                  </span>
                }
                style={{ marginBottom: 20 }}
              >
                {form.getFieldDecorator('trackingEnvs', {
                  initialValue: groupMLflowConfig.trackingEnvs,
                })(
                  <EnvFields
                    empty={null}
                    dumbValue={groupMLflowConfig.trackingEnvs}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Item
                label={
                  <span>
                    Artifact Store Environment Variables {this.artifactEnvsTips}
                  </span>
                }
                style={{ marginBottom: 20 }}
              >
                {form.getFieldDecorator('artifactEnvs', {
                  initialValue: groupMLflowConfig.artifactEnvs,
                })(
                  <EnvFields
                    empty={null}
                    dumbValue={groupMLflowConfig.artifactEnvs}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Item style={{ textAlign: 'right', marginTop: 12 }}>
                <InfuseButton
                  type='primary'
                  htmlType='submit'
                  style={{ width: '100%' }}
                >
                  Save
                </InfuseButton>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Skeleton>
    );
  }
}

export default compose(
  Form.create(),
  withGroupContext,
  graphql(PhApplicationsConnection, {
    options: (props: any) => {
      const { groupContext } = props;
      const where = {
        appName_contains: 'mlflow',
        groupName_in: [groupContext.name],
      };

      return {
        variables: {
          first: 999,
          where,
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getPhApplicationConnection',
    alias: 'withPhApplicationConnection',
  }),
  graphql(GetGroupMLflowConfig, {
    options: (props: any) => ({
      variables: {
        where: {
          id: props.groupContext.id,
        },
      },
      fetchPolicy: 'cache-and-network',
    }),
    name: 'getGroupMLflowConfig',
    alias: 'withGetGroupMLflowConfig',
  }),
  graphql(UpdateGroupMLflowConfig, {
    options: () => ({
      onCompleted: () => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: <>MLflow setup updated.</>,
        });
      },
      onError: errorHandler,
    }),
    name: 'updateGroupMLflowConfig',
    alias: 'withUpdateGroupMLflowConfig',
  })
)(GroupSettingsMLflow);
