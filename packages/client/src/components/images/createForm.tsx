import * as React from 'react';
import {
  Checkbox, Button, Radio, Select, Form, Card, Divider, Tabs,
  Row, Col, Input, Modal, Tooltip, Icon, InputNumber, Switch} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get, snakeCase, debounce, isEmpty} from 'lodash';
import Log from 'components/share/log';
import InfuseButton from 'components/infuseButton';
import ImagePullSecret from 'components/share/ImagePullSecret';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';
import styled from 'styled-components';

const { TextArea } = Input;
const { TabPane } = Tabs;

const StyledFormItem = styled(Form.Item)`
  > .ant-form-item-label label:after {
    content: "";
  }
`;

enum FormType {
  Edit = 'edit',
  Create = 'create'
}

enum ImageType {
  CPU = 'cpu',
  GPU = 'gpu',
  ALL = 'both'
}

enum BuildType {
  EXIST = 'exist',
  CUSTOM = 'custom'
}

const { Option } = Select;

type Props = FormComponentProps & {
  groupContext: any;
  refetchGroup: Function;
  groups: Array<Record<string, any>>;
  selectedGroup: string;
  instanceTypes: Array<Record<string, any>>;
  onSubmit: Function;
  onRebuild: Function;
  onCancelBuild: Function;
  onCancel?: Function;
  loading: boolean;
  initialValue?: any;
  formType?: FormType;
};

type State = {
  showGpuUrl: boolean
  imageType: ImageType
  buildType: BuildType
  buildModalVisible: boolean
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
};

type FormValue = {
  groupId: string;
  displayName: string;
  name: string;
  id: string;
  type: string;
  useImagePullSecret: string;
  description: string;
  url: string;
  urlForGpu: string;
  baseImage: string;
  pullSecret: string;
  logEndpoint: string;
  jobStatus: any;
  apt: string;
  pip: string;
  conda: string;
};

const dashOrNumber = value => value === null ? '-' : value;

const autoGenId = (name: string) => {
  const normalizedNAme = name.replace(/[\W_]/g, '-').toLowerCase();
  const randomString = Math.random().toString(36).substring(7).substring(0, 5);
  return `${normalizedNAme}-${randomString}`;
};

class ImageCreateForm extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    const {formType, initialValue} = props;
    this.state = {
      showGpuUrl: formType === FormType.Edit
        && (!isEmpty(initialValue.urlForGpu)
        && initialValue.url !== initialValue.urlForGpu),
      imageType: (initialValue && initialValue.type) || ImageType.ALL,
      buildType: (initialValue && initialValue.imageSpec) ? BuildType.CUSTOM : BuildType.EXIST,
      buildModalVisible: false
    };
  }

  submit = e => {
    const {form, onSubmit} = this.props;
    e.preventDefault();
    form.validateFields(async (err, values: FormValue) => {
      if (err) return;
      onSubmit(values);
    });
  }

  rebuild = e => {
    const {form, onRebuild} = this.props;
    e.preventDefault();
    form.validateFields(async (err, values: FormValue) => {
      if (err) return;
      onRebuild(values);
      this.hideBuildingModal();
    });
  }

  cancelBuild = () => {
    const {form, onCancelBuild} = this.props;
    if (!onCancelBuild) return;
    const values = form.getFieldsValue();
    onCancelBuild(() => {
      this.hideBuildingModal();
    });
  }

  cancel = () => {
    const {form, onCancel} = this.props;
    if (!onCancel) return;
    const values = form.getFieldsValue();
    onCancel(values);
  }

  handleGpuVisible = e => {
    this.setState({showGpuUrl: e.target.checked});
  }

  renderLabel = (defaultLabel: string, invalid: boolean, message: any) => {
    let label = <span>{defaultLabel}</span>;
    if (invalid) {
      label = (<span>
        {defaultLabel} <span style={{color: 'red'}}>({message})</span>
      </span>);
    }
    return label;
  }

  handleBuildingType = e => {
    this.setState({
      buildType: e.target.value,
    });
  }

  handleTypeChange = value => {
    const {form} = this.props;
    const type = value;
    this.setState({imageType: type});
    form.setFieldsValue({ type });
  }

  handleNameChange = debounce(() => {
    const {form, formType} = this.props;
    // Don't change name(id) in edit mode.
    if (formType === FormType.Edit) {
      return;
    }
    form.validateFields(['displayName'], (err, val) => {
      if (err) {
        return form.setFieldsValue({ id: '' });
      }
      const name = autoGenId(val.displayName);
      form.setFieldsValue({ name });
    });

  }, 400);

  renderBuildingLink = (isReady = false, jobStatus = '') => {
    let msg = 'Image building in progess...';
    if (isReady && jobStatus === 'Succeeded') {
      msg = 'View build details';
    } else if (jobStatus === 'Failed') {
      msg = 'Image build failed';
    } else if (jobStatus === 'Cancelled') {
      msg = 'Image build cancelled';
    }
    return (<a onClick={() => this.showBuildingModal()}>{msg}</a>);
  }

  buildModalEditable = (isReady, jobStatus) => {
    const phase = get(jobStatus, 'phase', '');
    let result = false;
    switch (phase) {
      case 'Succeeded':
      case 'Failed':
      case 'Cancelled':
        result = true;
        break;
      default:
        result = false;
    }
    return result;
  }

  showBuildingModal = () => {
    this.setState({buildModalVisible: true});
  }

  hideBuildingModal = () => {
    this.setState({buildModalVisible: false});
  }

  renderBuildCustomImageForm = (form, formType, url, isReady, jobStatus, imageSpec = {}, packages = {}) => {
    if (formType === FormType.Edit) {
      return (
        <StyledFormItem
          label={<span>Container image url : {this.renderBuildingLink(isReady, get(jobStatus, 'phase', ''))}</span>}
          style={{marginBottom: '12px'}}>
          {form.getFieldDecorator('url', {
            initialValue: url
          })(
            <Input disabled />
          )}
        </StyledFormItem>
      );
    } else {
      return (
        <>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label='Base image url' style={{marginBottom: '12px'}}>
                {form.getFieldDecorator('imageSpec.baseImage', {
                  initialValue: imageSpec.baseImage,
                  rules: [
                    {
                      required: true,
                      message: 'Please give a base image url'
                    }
                  ]
                })(
                  <Input />
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={`Image Pull Secret`}>
                {form.getFieldDecorator('imageSpec.pullSecret', {
                  initialValue: imageSpec.pullSecret,
                })(
                  <ImagePullSecret />
                )}
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label='Packages'>
            <Card>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label={`APT`} style={{marginBottom: '10px'}}>
                    {form.getFieldDecorator('imageSpec.packages.apt', {
                      initialValue: packages.apt,
                    })(
                      <TextArea rows={4}/>
                    )}
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label={`Conda`} style={{marginBottom: '10px'}}>
                    {form.getFieldDecorator('imageSpec.packages.conda', {
                      initialValue: packages.conda,
                    })(
                      <TextArea rows={4}/>
                    )}
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label={`pip`} style={{marginBottom: '10px'}}>
                    {form.getFieldDecorator('imageSpec.packages.pip', {
                      initialValue: packages.pip,
                    })(
                      <TextArea rows={4}/>
                    )}
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Form.Item>
        </>
      );
    }
  }

  render() {
    const {
      groupContext,
      refetchGroup,
      groups,
      loading,
      form,
      initialValue,
      selectedGroup,
      formType
    } = this.props;
    const {
      groupId,
      groupName,
      name,
      displayName,
      id,
      type,
      url,
      useImagePullSecret,
      description,
      imageSpec,
      isReady,
      jobStatus,
      logEndpoint
    } = initialValue || {};
    let urlForGpu = formType !== FormType.Edit || !this.state.showGpuUrl || (initialValue.url == initialValue.urlForGpu) ? null : initialValue.urlForGpu;
    const { packages } = imageSpec || {};
    const { buildModalVisible } = this.state;
    const imageReady = this.buildModalEditable(isReady, jobStatus);
    return (
      <Form onSubmit={this.submit}>
        <Row>
          <Col>
            <Card loading={loading} style={{overflow: 'auto'}}>
              <Form.Item label={`Display name`} style={{marginBottom: '8px'}}>
                {form.getFieldDecorator('displayName', {
                  initialValue: displayName,
                  rules: [
                    {
                      whitespace: true,
                      required: true,
                      message: 'Please input a name!'
                    },
                    {
                      pattern: /^[a-zA-Z0-9][a-zA-Z0-9\s-_]*/,
                      message: `alphanumeric characters, '-' or '_' , and must start with an alphanumeric character.`
                    }
                  ],
                })(
                  <Input onChange={this.handleNameChange} />
                )}
              </Form.Item>
              <Form.Item label={`Image name`}>
                {form.getFieldDecorator('name', {
                  initialValue: name
                })(
                  <Input disabled />
                )}
              </Form.Item>
              <Form.Item label='Description'>
                {form.getFieldDecorator('description', {
                  initialValue: description
                })(
                  <Input />
                )}
              </Form.Item>
              <Divider/>
              <Form.Item>
                <Radio.Group
                  disabled={formType === FormType.Edit}
                  onChange={this.handleBuildingType}
                  value={this.state.buildType}>
                  <Radio value={BuildType.EXIST}>
                    Use existing one
                  </Radio>
                  <Radio value={BuildType.CUSTOM}>
                    Build Custom Image
                  </Radio>
                </Radio.Group>
              </Form.Item>
              {
                this.state.buildType === BuildType.CUSTOM ? (
                  <>
                    <Form.Item label='Type'>
                      {form.getFieldDecorator('type', {
                        initialValue: type || ImageType.ALL,
                        rules: [
                          {
                            required: true,
                            message: 'Please select a type.'
                          }
                        ]
                      })(
                        <Select style={{width: '200px'}} onChange={this.handleTypeChange}>
                          <Option key='cpu' value='cpu'>cpu</Option>
                          <Option key='gpu' value='gpu'>gpu</Option>
                          <Option key='both' value='both'>universal</Option>
                        </Select>
                      )}
                    </Form.Item>
                    { this.renderBuildCustomImageForm(form, formType, url, isReady, jobStatus, imageSpec, packages) }
                  </>
                ) : (
                  <>
                    <Form.Item label='Type'>
                      {form.getFieldDecorator('type', {
                        initialValue: type || ImageType.ALL,
                        rules: [
                          {
                            required: true,
                            message: 'Please select a type.'
                          }
                        ]
                      })(
                        <Select style={{width: '200px'}} onChange={this.handleTypeChange}>
                          <Option key='cpu' value='cpu'>cpu</Option>
                          <Option key='gpu' value='gpu'>gpu</Option>
                          <Option key='both' value='both'>universal</Option>
                        </Select>
                      )}
                    </Form.Item>
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item label='Container image url' style={{marginBottom: '12px'}}>
                          {form.getFieldDecorator('url', {
                            initialValue: url
                          })(
                            <Input />
                          )}
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label={`Image Pull Secret`}>
                          {form.getFieldDecorator('useImagePullSecret', {
                            initialValue: useImagePullSecret,
                          })(
                            <ImagePullSecret />
                          )}
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={24} style={{display: (this.state.imageType === ImageType.ALL) ? 'block' : 'none'}}>
                      <Col span={12}>
                        <Form.Item style={{marginBottom: '0'}}>
                          <Checkbox style={{color: '#000000D9'}}
                            checked={this.state.showGpuUrl}
                            onChange={this.handleGpuVisible}>
                            Specific container image url for GPU
                          </Checkbox>
                        </Form.Item>
                        <Form.Item>
                          {form.getFieldDecorator('urlForGpu', {
                            initialValue: urlForGpu
                          })(
                            <Input disabled={!this.state.showGpuUrl}/>
                          )}
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )
              }
            </Card>
            <Form.Item style={{textAlign: 'right', marginTop: 12}}>
              {
                formType === FormType.Edit ? (
                  <>
                    <InfuseButton
                      type="primary"
                      htmlType="submit"
                      style={{marginRight: 16, width: '100%'}}
                    >
                      Confirm
                    </InfuseButton>
                    <InfuseButton onClick={this.cancel} style={{width: "100%"}}>
                      Cancel
                    </InfuseButton>
                  </>
                ) : (
                  <InfuseButton type="primary" htmlType="submit" style={{width: "100%"}}>
                    Create
                  </InfuseButton>
                )
              }
            </Form.Item>
          </Col>
        </Row>
        {
          formType === FormType.Edit && imageSpec ? (
          <Modal
            width="calc(100% - 128px)"
            style={{marginLeft: '64px'}}
            footer={null}
            visible={this.state.buildModalVisible}
            onCancel={this.hideBuildingModal}>
            <div>
              <Tabs defaultActiveKey="details">
                <TabPane tab="Build Details" key="details">
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label='Base image url' style={{marginBottom: '12px'}}>
                        {form.getFieldDecorator('imageSpec.baseImage', {
                          initialValue: get(imageSpec, 'baseImage', ''),
                          rules: [
                            {
                              required: true,
                              message: 'Please give a base image url'
                            }
                          ]
                        })(
                          <Input disabled={!imageReady} />
                        )}
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={`Image Pull Secret`}>
                        {form.getFieldDecorator('imageSpec.pullSecret', {
                          initialValue: get(imageSpec, 'pullSecret', ''),
                        })(
                          <ImagePullSecret disabled={!imageReady} />
                        )}
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label='Status' style={{marginBottom: '12px'}}>
                    <Input disabled value={get(jobStatus, 'phase', 'Unknow')} />
                  </Form.Item>
                  <Form.Item label='Packages'>
                    <Card>
                      <Row gutter={24}>
                        <Col span={8}>
                          <Form.Item label={`APT`} style={{marginBottom: '10px'}}>
                            {form.getFieldDecorator('imageSpec.packages.apt', {
                              initialValue: get(packages, 'apt', []).join('\n'),
                            })(
                              <TextArea disabled={!imageReady} rows={4}/>
                            )}
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label={`Conda`} style={{marginBottom: '10px'}}>
                            {form.getFieldDecorator('imageSpec.packages.conda', {
                              initialValue: get(packages, 'conda', []).join('\n'),
                            })(
                              <TextArea disabled={!imageReady} rows={4}/>
                            )}
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label={`pip`} style={{marginBottom: '10px'}}>
                            {form.getFieldDecorator('imageSpec.packages.pip', {
                              initialValue: get(packages, 'pip', []).join('\n'),
                            })(
                              <TextArea disabled={!imageReady} rows={4}/>
                            )}
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  </Form.Item>
                </TabPane>
                <TabPane tab="Log" key="log">
                  <Log
                    endpoint={logEndpoint}
                  />
                </TabPane>
              </Tabs>
              <Form.Item style={{textAlign: 'right', marginTop: 12}}>
                {
                  imageReady ? (
                    <>
                      <InfuseButton type='primary' onClick={this.rebuild} style={{marginRight: '5px'}}>
                        Rebuild
                      </InfuseButton>
                      <InfuseButton onClick={this.hideBuildingModal}>
                        Close
                      </InfuseButton>
                    </>
                  ) : (
                    <>
                      <InfuseButton type="primary" onClick={this.hideBuildingModal} style={{marginRight: '5px'}}>
                        Close
                      </InfuseButton>
                      <InfuseButton onClick={this.cancelBuild}>
                        Cancel Build
                      </InfuseButton>
                    </>
                  )
                }
              </Form.Item>
            </div>
          </Modal>) : (<></>)}
      </Form>
    )
  }
}


export default Form.create<Props>()(ImageCreateForm);
