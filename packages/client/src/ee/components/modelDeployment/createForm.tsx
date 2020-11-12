import * as React from 'react';
import {Button, Radio, Select, Form, Card, Divider, Row, Col, Input, Tooltip, Icon, InputNumber, Switch} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get, snakeCase, debounce} from 'lodash';
import DynamicFields from 'components/share/dynamicFields';
import EnvFields from 'components/share/envFields';
import InfuseButton from 'components/infuseButton';
import ImagePullSecret from 'components/share/ImagePullSecret';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';

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
}

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
}

class DeploymentCreateForm extends React.Component<Props, State> {
  state = {
    recurrenceError: '',
    revealEnv: false
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
    e.preventDefault();
    form.validateFields(async (err, values: FormValue) => {
      if (err) return;
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

  switchEnvVisibilty = () => {
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
    const {form} = this.props;
    const values = form.getFieldsValue();
    form.validateFields(['name'], (err, values) => {
      if (err) return form.setFieldsValue({ id: '' });
      const id = autoGenId(values.name);
      form.setFieldsValue({ id });
    });

  }, 400)

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
      type
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
      imagePullSecret,
      description,
      env,
      metadata,
      endpointAccessType,
    } = initialValue || {};
    const { revealEnv } = this.state;
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
      'InstanceTypes',
      invalidInitialInstanceType,
      <span>The instance type <b>{instanceTypeName}</b> was deleted.</span>
    )

    const revealBtn = (
      <span onClick={this.switchEnvVisibilty} style={{cursor: 'pointer'}}>
        {
          revealEnv ? <Icon type="eye" /> : <Icon type="eye-invisible" />
        }
      </span>
    );


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
              <Form.Item label={`Deployment name`} style={{marginBottom: '8px'}}>
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
              <Form.Item label={`Deployment ID`}>
                {form.getFieldDecorator('id', {
                  initialValue: id
                })(
                  <Input disabled />
                )}
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={`Model Image`}>
                    {form.getFieldDecorator('modelImage', {
                      rules: [
                        { whitespace: true, required: true, message: 'Please input a model image url!' },
                      ],
                      initialValue: modelImage
                    })(
                      <Input />
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
              <h3>Environment Variables { showRevealBtn == true ? revealBtn : null }</h3>
              <Form.Item >
                {form.getFieldDecorator('env', {
                  initialValue: env
                })(
                  <EnvFields empty={null} enableReveal={showRevealBtn} reveal={revealEnv} />
                )}
              </Form.Item>
              <Divider />
              <h3>Metadata</h3>
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
                  <Form.Item label="Replicas">
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
              <h3>Endpoint</h3>
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
