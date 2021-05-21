import React from 'react';
import {graphql} from 'react-apollo';
import {get, pick} from 'lodash';
import {compose} from 'recompose';
import {Tooltip, Icon, notification, Form, Row, Col, Input, Alert} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import InfuseButton from 'components/infuseButton';
import EnvFields from 'components/share/envFields';
import {errorHandler} from 'utils/errorHandler';
import {GroupContextComponentProps, withGroupContext} from 'context/group';
import {UpdateGroupMLflowConfig, GetGroupMLflowConfig} from 'queries/Group.graphql';
import Env from 'interfaces/env';

type MLflowConfigProps = {
  updateGroupMLflowConfig: any,
  getGroupMLflowConfig: any
} & GroupContextComponentProps & FormComponentProps;

interface FormValue {
  trackingUri: string;
  uiUrl: string;
  trackingEnvs: Env[];
  artifactEnvs: Env[];
}

class GroupSettingsMLflow extends React.Component<MLflowConfigProps> {
  trackingEnvsTips = (
    <Tooltip
      placement='right'
      title={<span>This is used to access the MLflow tracking server, <a style={{color: '#739af3'}} target='_blank' href='https://www.mlflow.org/docs/latest/tracking.html#logging-to-a-tracking-server'>Learn more</a></span>}>
      <Icon type='question-circle' />
    </Tooltip>
  );

  artifactEnvsTips = (
    <Tooltip
      placement='right'
      title={<span>This is used to access the MLflow artifact stores, <a style={{color: '#739af3'}} target='_blank' href='https://www.mlflow.org/docs/latest/tracking.html#artifact-stores'>Learn more</a></span>}>
      <Icon type='question-circle' />
    </Tooltip>
  );

  onSubmit = e => {
    const {updateGroupMLflowConfig, groupContext, form} = this.props;
    e.preventDefault();
    form.validateFields(async (err, values: FormValue) => {
      if (err) return;
      updateGroupMLflowConfig({
        variables: {
          where: {id: groupContext.id},
          data: pick(values, ['trackingUri', 'uiUrl', 'trackingEnvs', 'artifactEnvs'])
        }
      });
    });
  }
  render() {
    const {getGroupMLflowConfig, form} = this.props;
    if (!getGroupMLflowConfig.group) return null;
    const groupMLflowConfig = get(getGroupMLflowConfig, 'group.mlflow', {});
    return (
      <Form onSubmit={this.onSubmit}>
      <Alert
        message={<span>You can setup a MLflow application in PrimeHub Apps to configure MLflow settings. <a href='https://docs.primehub.io/docs/model-configuration'>Learn more</a></span>}
        type='info'
        closeText='Got It'
        showIcon />
        <Row style={{marginTop: 5}}>
          <Col>
            <Form.Item label={`MLflow Tracking URI`} style={{marginBottom: 20}}>
              {form.getFieldDecorator('trackingUri', {
                initialValue: groupMLflowConfig.trackingUri,
                rules: [
                  {required: true}
                ]
              })(
                <Input/>
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`MLflow UI URI`} style={{marginBottom: 20}}>
              {form.getFieldDecorator('uiUrl', {
                initialValue: groupMLflowConfig.uiUrl,
              })(
                <Input/>
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={<span>Tracking Environment Variables {this.trackingEnvsTips}</span>} style={{marginBottom: 20}}>
              {form.getFieldDecorator('trackingEnvs', {
                initialValue: groupMLflowConfig.trackingEnvs
              })(
                <EnvFields empty={null} dumbValue={groupMLflowConfig.trackingEnvs}/>
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={<span>Artifact Store Environment Variables {this.artifactEnvsTips}</span>} style={{marginBottom: 20}}>
              {form.getFieldDecorator('artifactEnvs', {
                initialValue: groupMLflowConfig.artifactEnvs
              })(
                <EnvFields empty={null} dumbValue={groupMLflowConfig.artifactEnvs}/>
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item style={{textAlign: 'right', marginTop: 12}}>
              <InfuseButton type='primary' htmlType='submit' style={{width: '100%'}}>
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
  graphql(GetGroupMLflowConfig, {
    options: (props: any) => ({
      variables: {
        where: {
          id: props.groupContext.id
        }
      },
      fetchPolicy: 'cache-and-network',
    }),
    name: 'getGroupMLflowConfig',
    alias: 'withGetGroupMLflowConfig'
  }),
  graphql(UpdateGroupMLflowConfig, {
    options: (props: any) => ({
      onCompleted: (data: any) => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              MLflow setup updated.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'updateGroupMLflowConfig',
    alias: 'withUpdateGroupMLflowConfig'
  })
)(GroupSettingsMLflow);
