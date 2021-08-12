import * as React from 'react';
import {Radio, Select, Form, Card, Divider, Row, Col, Input, Tooltip, Icon, InputNumber, Switch, AutoComplete, Checkbox} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get, snakeCase, debounce} from 'lodash';
import DynamicFields from 'components/share/dynamicFields';
import EnvFields from 'components/share/envFields';
import InfuseButton from 'components/infuseButton';
import ImagePullSecret from 'components/share/ImagePullSecret';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';
import {PrePackagedServers} from 'ee/components/modelDeployment/prePackagedServers';
import PHTooltip from 'components/share/toolTip';
import gql from 'graphql-tag';
import { ApolloConsumer } from 'react-apollo';
import { ApolloClient } from 'apollo-client';

const { Option } = Select;

type Props = FormComponentProps & {
  groupContext: any;
  refetchGroup: Function;
  groups: Array<Record<string, any>>;
  onSelectGroup?: Function;
  selectedGroup: string;
  instanceTypes: Array<Record<string, any>>;
  onSubmit: Function;
  onCancel?: Function;
  loading: boolean;
  initialValue?: any;
  type?: 'edit' | 'create';
};

type State = {
  revealEnv: boolean;
  customizeId: boolean;
  customizeIdValidateStatus?: 'validating' | 'success' | 'error';
  customizeIdHelp?: string;
};

const radioStyle = {
  display: 'block',
  padding: '4px 8px',
  margin: 0,
  border: '1px solid #e8e8e8',
};

const radioContentStyle = {
  display: 'inline-block',
  verticalAlign: 'top'
};

const radioGroupStyle = {
  width: '100%',
  maxHeight: '30vh',
  overflow: 'auto',
  border: '1px solid #e8e8e8',
}

type FormValue = {
  groupId: string;
  instanceType: string;
  name: string;
  id: string;
  modelImage: string;
  modelURI: string;
  imagePullSecret: string;
  env: Array<{name: string, value: string}>;
  metadata: object;
  description: string;
  updateMessage: string;
  replicas: number;
  privateAccess: boolean;
  endpointAccessType: string;
};

const dashOrNumber = value => value === null ? '-' : value;

const autoGenId = (name: string) => {
  const normalizedNAme = name.replace(/[\W_]/g, '-').toLowerCase();
  const randomString = Math.random().toString(36).substring(7).substring(0, 5);
  return `${normalizedNAme}-${randomString}`;
};

class DeploymentCreateForm extends React.Component<Props, State> {
  state = {
    recurrenceError: '',
    revealEnv: false,
    modelImageSearchText: '',
    customizeId: false,
    customizeIdValidateStatus: null,
    customizeIdHelp: null,
  };

  componentDidMount() {
    const {initialValue} = this.props;
    if (!initialValue) {
      this.autoSelectFirstGroup();
      this.autoSelectFirstInstanceType();
    }
  }

  componentDidUpdate() {
    this.autoSelectFirstGroup();
    this.autoSelectFirstInstanceType();
  }

  autoSelectFirstGroup = () => {
    const {onSelectGroup, selectedGroup, groups, form} = this.props;
    if (!selectedGroup && groups.length) {
      const id = get(groups[0], 'id', null);
      onSelectGroup && onSelectGroup(id);
      form.setFieldsValue({groupId: id});
    }
  }

  autoSelectFirstInstanceType = () => {
    const {instanceTypes, form} = this.props;
    const currentInstanceType = form.getFieldValue('instanceType');
    const validInstanceType = instanceTypes.some(instanceType => instanceType.id === currentInstanceType);
    if ((!form.getFieldValue('instanceType') || !validInstanceType) && instanceTypes.length) {
      form.setFieldsValue({instanceType: instanceTypes[0].id});
    }
  }

  submit = (e) => {
    const {form, onSubmit} = this.props;
    const {customizeIdValidateStatus} = this.state;
    e.preventDefault();
    form.validateFields(async (err, values: FormValue) => {
      if (err) return;
      if (customizeIdValidateStatus === 'error') return;
      if (!values.metadata) values.metadata = {}
      values.endpointAccessType = values.privateAccess ? 'private' : 'public';
      delete values.privateAccess;
      onSubmit(values);
    });
  }

  cancel = () => {
    const {form, onCancel} = this.props;
    if (!onCancel) return;
    const values = form.getFieldsValue();
    onCancel(values);
  }

  toggleEnvVisibilty = () => {
    const revealEnv = !this.state.revealEnv;
    this.setState({
      revealEnv
    });
  }

  renderLabel = (defaultLabel: string, invalid: boolean, message: any) => {
    let label = <span>{defaultLabel}</span>;
    if (invalid)
      label = <span>
        {defaultLabel} <span style={{color: 'red'}}>({message})</span>
      </span>
    return label;
  }

  handleNameChange = debounce(() => {
    const { form } = this.props;
    const { customizeId } = this.state;

    if (customizeId) {
      return;
    }

    form.validateFields(['name'], (err, values) => {
      if (err) return form.setFieldsValue({ id: '' });
      const id = autoGenId(values.name);
      form.setFieldsValue({ id });
    });
  }, 400);

  handleDeploymentIdCheck = (e) => {
    this.setState({
      customizeId: e.target.checked,
      customizeIdValidateStatus: null,
      customizeIdHelp: null,
    });

    if (!e.target.checked) {
      this.handleNameChange();
    }
  };

  handleIdChange = debounce(async (client: ApolloClient<any>, deploymentId) => {
    const rules = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!deploymentId) {
      this.setState({
        customizeIdValidateStatus: 'error',
        customizeIdHelp: "Please input an ID",
      });
      return;
    }

    if (!rules.test(deploymentId)) {
      this.setState({
        customizeIdValidateStatus: 'error',
        customizeIdHelp:
          "lower case alphanumeric characters, '-', and must start and end with an alphanumeric character.",
      });
      return;
    }

    const CHECK_DEPLOYMENT_AVAIL = gql`
      query checkDeploymentAvail($deploymentId: ID!) {
        phDeploymentAvail(where: {id: $deploymentId})
      }
    `;

    this.setState({
      customizeIdValidateStatus: 'validating',
      customizeIdHelp: null,
    });

    const result = await client.query<any>({
      query: CHECK_DEPLOYMENT_AVAIL,
      variables: {
        deploymentId,
      },
      fetchPolicy: 'no-cache',
    });
    const avail = get(result, 'data.phDeploymentAvail');
    if (avail) {
      this.setState({
        customizeIdValidateStatus: 'success',
        customizeIdHelp: `Your Deployment ID is available. Uncheck the box will reset this id.`,
      });
    } else {
      this.setState({
        customizeIdValidateStatus: 'error',
        customizeIdHelp:
          'The ID has been used by other users. Change your ID to a unique string to try again.',
      });
    }

  }, 400);

  handleSearch = modelImageSearchText => {
    this.setState({modelImageSearchText});
  }

  renderDeploymentIdFormItem = (initialValue) => {
    const { form, type } = this.props;

    const { customizeId, customizeIdValidateStatus, customizeIdHelp } = this.state;

    const _renderItem = (client) => {
      const formLabel = (
        <span>
          Deployment ID{' '}
          <PHTooltip
            tipText="Check the box to customize your Deployment ID. The ID should be unique in PrimeHub"
            tipLink="https://docs.primehub.io/docs/model-deployment-feature#deployment-details"
            placement="right"
            style={{ margintLeft: 8 }}
          />
        </span>
      );

      const cbDeploymentId = (
        <Checkbox
          style={{ marginRight: 8 }}
          onChange={this.handleDeploymentIdCheck}
        />
      );

      return (
        <Form.Item
          label={formLabel}
          hasFeedback={customizeId}
          validateStatus={customizeIdValidateStatus}
          help={customizeIdHelp}
          required
        >
          {type === 'create' ? cbDeploymentId : null}
          {form.getFieldDecorator('id', { initialValue })(
            <Input
              style={{
                width: type === 'create' ? 'calc(100% - 24px)' : '100%',
              }}
              disabled={!customizeId}
              onChange={(e) => {
                this.handleIdChange(client, e.target.value);
              }}
            />
          )}
        </Form.Item>
      );
    };

    return <ApolloConsumer>{(client) => _renderItem(client)}</ApolloConsumer>;
  };

  render() {
    const {
      groupContext,
      refetchGroup,
      groups,
      onSelectGroup,
      instanceTypes,
      loading,
      form,
      initialValue,
      selectedGroup,
      type,
    } = this.props;
    const {
      groupId,
      groupName,
      instanceTypeId,
      instanceTypeName,
      name,
      replicas,
      id,
      modelImage,
      modelURI,
      imagePullSecret,
      description,
      env,
      metadata,
      endpointAccessType,
    } = initialValue || {};
    const { revealEnv, modelImageSearchText } = this.state;
    const showRevealBtn = !!(type === 'edit')
    const invalidInitialGroup = groupId && selectedGroup === groupId && !groups.find(group => group.id === groupId);
    const groupLabel = this.renderLabel(
      'Group',
      invalidInitialGroup,
      <span>The group <b>{groupName}</b> was deleted.</span>
    )

    const invalidInitialInstanceType = !invalidInitialGroup &&
      instanceTypeId &&
      !form.getFieldValue('instanceType') &&
      !instanceTypes.find(it => it.id === instanceTypeId);
    const instanceTypeLabel = this.renderLabel(
      'Instance Types',
      invalidInitialInstanceType,
      <span>The instance type <b>{instanceTypeName}</b> was deleted.</span>
    )

    const revealBtn = (
      <span onClick={this.toggleEnvVisibilty} style={{cursor: 'pointer'}}>
        { revealEnv ? <Icon type="eye" title='Hide value' /> : <Icon type="eye-invisible" title="Show value" /> }
      </span>
    );

    const dataSource = PrePackagedServers
    .filter(image => image.title.indexOf(modelImageSearchText) > -1)
    .map((image, i) => {
      const title = image.title;
      const index = title.indexOf(modelImageSearchText);
      const name = <span>
        {title.substr(0, index)}
        <b>{title.substr(index, modelImageSearchText.length)}</b>
        {title.substr(index + modelImageSearchText.length)}
      </span>
      return (
        <Option value={image.url} key={image.url}>
          {name} <a href={image.docLink} target='_blank' onClick={event => event.stopPropagation()}><Icon type='link' /></a>
        </Option>
      );
    })

    return (
      <Form onSubmit={this.submit}>
        <Row gutter={16}>
          <Col xs={24} sm={16} lg={16}>
              {
                groups.length ? (
                  <Form.Item label={groupLabel} style={ groupContext ? { display: 'none' } : {} }>
                    {form.getFieldDecorator('groupId', {
                      initialValue: invalidInitialGroup ? '' : groupId,
                      rules: [{ required: true, message: 'Please select a group!' }],
                    })(
                      <Select disabled={type === 'edit'} placeholder="Please select a group" onChange={id => onSelectGroup(id)}>
                        {groups.map(group => (
                          <Option key={group.id} value={group.id}>
                            {group.displayName || group.name}
                          </Option>
                        ))}
                      </Select>,
                    )}
                  </Form.Item>
                ) : (
                  <Form.Item>
                    <Card>
                      No group is configured for you to launch a server. Please contact admin.
                    </Card>
                  </Form.Item>
                )
              }
            <Card loading={loading} style={{overflow: 'auto'}}>
              <Form.Item label={`Deployment Name`} style={{marginBottom: '8px'}}>
                {form.getFieldDecorator('name', {
                  initialValue: name,
                  rules: [
                    { whitespace: true, required: true, message: 'Please input a name!' },
                    { pattern: /^[a-zA-Z0-9][a-zA-Z0-9\s-_]*/, message: `alphanumeric characters, '-' or '_' , and must start with an alphanumeric character.`}
                  ],
                })(
                  <Input disabled={type === 'edit'} onChange={this.handleNameChange} />
                )}
              </Form.Item>
              {this.renderDeploymentIdFormItem(id)}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={<span>Model Image <PHTooltip tipText='Model Image is an image integrated a model file into, which can be deployed as a service.' tipLink='https://docs.primehub.io/docs/model-deployment-language-wrapper-intro' placement='right' style={{margintLeft: 8}}/></span>}>
                    {form.getFieldDecorator('modelImage', {
                      rules: [
                        { whitespace: true, required: true, message: 'Please input a model image url!' },
                      ],
                      initialValue: modelImage
                    })(
                      <AutoComplete
                        dataSource={dataSource}
                        showSearch
                        value={modelImage}
                        onSearch={this.handleSearch}
                        showArrow={false}
                        filterOption={false}
                        optionLabelProp="value"
                      />
                    )}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={`Image Pull Secret`}>
                    {form.getFieldDecorator('imagePullSecret', {
                      initialValue: imagePullSecret,
                    })(
                      <ImagePullSecret />
                    )}
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label={(<span>Model URI <PHTooltip tipText='The location where the trained model is stored; based on this model file to deploy a model image.' tipLink='https://docs.primehub.io/docs/model-deployment-model-uri' placement='right' style={{margintLeft: 8}}/></span>)}>
                {form.getFieldDecorator('modelURI', {
                  initialValue: modelURI,
                  rules: [
                    {
                      required: false,
                      message: 'PHFS is not supported in this installation.',
                      validator: (rule, value, callback) => (value && value.length > 4 && value.substring(0, 4) === 'phfs' && !window.enablePhfs ? callback('PHFS is not supported in this installation.') : callback())
                    }
                  ],
                })(
                  <Input />
                )}
              </Form.Item>

              <Form.Item label="Description" >
                {form.getFieldDecorator('description', {
                  initialValue: description
                })(
                  <Input.TextArea
                    rows={4}
                  />
                )}
              </Form.Item>

              <Divider />
              <h3>Environment Variables { showRevealBtn == true ? revealBtn : null } <PHTooltip tipText='Key-value pairs of variables provided to the instance as environmental variables.' tipLink='https://docs.primehub.io/docs/model-deployment-feature#environment-variables' placement='right' style={{margintLeft: 8}}/></h3>
              <Form.Item >
                {form.getFieldDecorator('env', {
                  initialValue: env
                })(
                  <EnvFields empty={null} enableReveal={showRevealBtn} reveal={revealEnv} />
                )}
              </Form.Item>
              <Divider />
              <h3>Metadata <PHTooltip tipText='Key-value pairs of variables provided to the instance as metadata.' tipLink='https://docs.primehub.io/docs/model-deployment-feature#metadata' placement='right' style={{margintLeft: 8}}/></h3>
              <Form.Item >
                {form.getFieldDecorator('metadata', {
                  initialValue: metadata
                })(
                  <DynamicFields empty={null}/>
                )}
              </Form.Item>

              <Divider />
              <h3>Resources</h3>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={instanceTypeLabel}>
                    {form.getFieldDecorator('instanceType', {
                      initialValue: instanceTypeId,
                    })(
                      instanceTypes.length ? (
                        <Radio.Group style={radioGroupStyle}>
                          {instanceTypes.map(instanceType => (
                            <Radio style={radioStyle} value={instanceType.id} key={instanceType.id}>
                              <div style={radioContentStyle}>
                                <h4>
                                  {instanceType.displayName || instanceType.name}
                                  <Tooltip
                                    title={`CPU: ${dashOrNumber(instanceType.cpuLimit)} / Memory: ${dashOrNumber(instanceType.memoryLimit)} G / GPU: ${dashOrNumber(instanceType.gpuLimit)}`}
                                  >
                                    <Icon
                                      type="info-circle"
                                      theme="filled"
                                      style={{marginLeft: 8}}
                                    />
                                  </Tooltip>
                                </h4>
                                {instanceType.description}
                              </div>
                            </Radio>
                          ))}
                        </Radio.Group>
                      ) : (
                        <Card>
                          No instance in this group.
                        </Card>
                      )
                    )}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={<span>Replicas <PHTooltip tipText='The amount of replicas of the running instance.' tipLink='https://docs.primehub.io/docs/model-deployment-feature#resources' placement='right' style={{margintLeft: 8}}/></span>}>
                    {form.getFieldDecorator('replicas', {
                      initialValue: replicas || 1,
                      rules: [{ required: true, message: 'Please input replicas!' }],
                    })(
                      <InputNumber min={1} precision={0} />
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <h3>Endpoint <PHTooltip tipText='The toggle of private access of the endpoint; if enabled, there is Clients tab appearing in detail page.' tipLink='https://docs.primehub.io/docs/model-deployment-feature#endpoint' placement='right' style={{margintLeft: 8}}/></h3>
              <Form.Item label="Private Access">
                {form.getFieldDecorator('privateAccess', {
                  initialValue: (endpointAccessType === 'private'),
                  valuePropName: 'checked'
                })(
                  <Switch></Switch>
                )}
              </Form.Item>

            </Card>
            <Row style={{marginTop: 24}}>
              <Card>
                <Form.Item label="Update Message" >
                  {form.getFieldDecorator('updateMessage', {
                    initialValue: ''
                  })(
                    <Input.TextArea
                      rows={4}
                    />
                  )}
                </Form.Item>
              </Card>
            </Row>
            <Form.Item style={{textAlign: 'right', marginTop: 12}}>
              {
                type === 'edit' ? (
                  <>
                    <InfuseButton
                      type="primary"
                      htmlType="submit"
                      style={{marginRight: 16, width: '100%'}}
                    >
                      Confirm and Deploy
                    </InfuseButton>
                    <InfuseButton onClick={this.cancel} style={{width: "100%"}}>
                      Cancel
                    </InfuseButton>
                  </>
                ) : (
                  <InfuseButton type="primary" htmlType="submit" style={{width: "100%"}}>
                    Deploy
                  </InfuseButton>
                )
              }
            </Form.Item>
          </Col>
          <Col xs="24" sm="8" lg="8">
            <ResourceMonitor
              selectedGroup={selectedGroup}
              groupContext={groupContext}
              refetchGroup={refetchGroup}
            />
          </Col>
        </Row>
      </Form>
    )
  }
}


export default Form.create<Props>()(DeploymentCreateForm);
