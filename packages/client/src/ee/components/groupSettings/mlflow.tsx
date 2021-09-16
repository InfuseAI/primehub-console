import React from 'react';
import { graphql } from 'react-apollo';
import { get, pick } from 'lodash';
import { compose } from 'recompose';
import { Link } from 'react-router-dom';
import { Select, notification, Form, Row, Col, Input } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import InfuseButton from 'components/infuseButton';
import EnvFields from 'components/share/envFields';
import { errorHandler } from 'utils/errorHandler';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import PHTooltip from 'components/share/toolTip';
import {
  UpdateGroupMLflowConfig,
  GetGroupMLflowConfig,
} from 'queries/Group.graphql';
import { PhApplicationsConnection } from 'queries/PhApplication.graphql';
import Env from 'interfaces/env';

const { Option } = Select;

type MLflowConfigProps = {
  updateGroupMLflowConfig: any;
  getGroupMLflowConfig: any;
  getPhApplicationConnection: any;
} & GroupContextComponentProps &
  FormComponentProps;

interface FormValue {
  trackingUri: string;
  uiUrl: string;
  trackingEnvs: Env[];
  artifactEnvs: Env[];
}

class GroupSettingsMLflow extends React.Component<MLflowConfigProps> {
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

  handleMLflowSetupChange = (value, option) => {
    const { form } = this.props;
    if (value) {
      const appUrl = get(option, 'props.data-app-url', '');
      form.setFieldsValue({
        trackingUri: value,
        uiUrl: appUrl,
      });
    }
  };

  renderMLflowOptions(apps: any[], currentTrackingUri: string) {
    const appList = apps.map(a => a.node);
    const disabled = appList.length <= 0;
    const optElements = appList.map(app => {
      const firstSvcEndpoint = `http://${get(app, 'svcEndpoints[0]', '')}`;
      return (
        <Option key={app.id} value={firstSvcEndpoint} data-app-url={app.appUrl}>
          {app.displayName}
        </Option>
      );
    });
    return (
      <div>
        <Select
          style={{ width: 260, marginRight: 20 }}
          disabled={disabled}
          defaultValue={disabled ? undefined : currentTrackingUri}
          onChange={this.handleMLflowSetupChange}
          data-testid='mlflow-app-selector'
          placeholder={disabled ? 'Not Available' : 'Select MLflow Apps'}
        >
          {optElements}
        </Select>
        {disabled ? (
          <Link to='apps/create/mlflow'>Create MLflow App</Link>
        ) : (
          <></>
        )}
      </div>
    );
  }

  render() {
    const { getGroupMLflowConfig, getPhApplicationConnection, form } =
      this.props;
    if (
      !getGroupMLflowConfig.group ||
      !getPhApplicationConnection.phApplicationsConnection
    )
      return null;
    const mlflowApps = get(
      getPhApplicationConnection,
      'phApplicationsConnection.edges',
      []
    );
    const groupMLflowConfig = get(getGroupMLflowConfig, 'group.mlflow', {});
    return (
      <Form onSubmit={this.onSubmit}>
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
              {this.renderMLflowOptions(
                mlflowApps,
                groupMLflowConfig.trackingUri
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row style={{ marginTop: 5 }}>
          <Col>
            <Form.Item
              label={`MLflow Tracking URI`}
              style={{ marginBottom: 20 }}
            >
              {form.getFieldDecorator('trackingUri', {
                initialValue: groupMLflowConfig.trackingUri,
                rules: [{ required: true }],
              })(<Input />)}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`MLflow UI URI`} style={{ marginBottom: 20 }}>
              {form.getFieldDecorator('uiUrl', {
                initialValue: groupMLflowConfig.uiUrl,
              })(<Input />)}
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
