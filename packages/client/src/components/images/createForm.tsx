import * as React from 'react';
import {
  Checkbox, Radio, Select, Form, Card, Divider, Tabs, Alert,
  Row, Col, Input, Modal } from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get, debounce, isEmpty, filter} from 'lodash';
import Log from 'components/share/log';
import InfuseButton from 'components/infuseButton';
import ImagePullSecret from 'components/share/ImagePullSecret';
import styled from 'styled-components';
import BuildCustomImageForm from './buildCustomImageForm';
import BaseImageRow from './baseImageRow';
import ImageType from 'constant/ImageType';

const { TextArea } = Input;
const { TabPane } = Tabs;

const StyledFormItem = styled(Form.Item)`
  > .ant-form-item-label label:after {
    content: "";
  }
`;

const DISABLE_BUILD_IMAGE = !window.customImageSetup;

enum FormType {
  Edit = 'edit',
  Create = 'create'
}

enum BuildType {
  EXIST = 'exist',
  CUSTOM = 'custom'
}

const { Option } = Select;

interface FormValue {
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
}

type Props = FormComponentProps & {
  refetchGroup: () => void;
  instanceTypes: Array<Record<string, any>>;
  availableImages: any[];
  onSubmit: () => void;
  onRebuild: () => void;
  onCancelBuild: () => void;
  onCancel?: () => void;
  loading: boolean;
  initialValue?: any;
  formType?: FormType;
};

interface State {
  showGpuUrl: boolean;
  imageType: ImageType;
  buildType: BuildType;
  buildModalVisible: boolean;
  searchText: string;
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
};

const dashOrNumber = value => value === null ? '-' : value;

const autoGenId = (name: string) => {
  const normalizedName = name.replace(/[\W_]/g, '-').toLowerCase();
  const randomString = Math.random().toString(36).substring(7).substring(0, 5);
  return `${normalizedName.substring(0, 57)}-${randomString}`;
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
      buildModalVisible: false,
      searchText: '',
    };
  }

  validatePackagesFilled(form) {
    const aptValue = form.getFieldValue('imageSpec.packages.apt');
    const pipValue = form.getFieldValue('imageSpec.packages.pip');
    const condaValue = form.getFieldValue('imageSpec.packages.conda');
    if (!aptValue && !pipValue && !condaValue) {
      form.setFields({
        'imageSpec.packages.apt': {
          errors: [new Error('You must input at least one package.')],
        },
        'imageSpec.packages.pip': {
          errors: [new Error('')],
        },
        'imageSpec.packages.conda': {
          errors: [new Error('')],
        }
      });
      return false;
    }
    return true;
  }

  trimPackages(label: string | undefined) {
    if (label === undefined) { return label; }
    return filter(label.split('\n').map(e => e.trim().split(' ')).flat(), p => !isEmpty(p)).join('\n');
  }

  submit = e => {
    const {form, onSubmit} = this.props;
    e.preventDefault();
    let validPackagesfilled = true;
    if (this.state.buildType === BuildType.CUSTOM) {
      validPackagesfilled = this.validatePackagesFilled(form);
    }
    form.validateFields(async (err, values: FormValue) => {
      if (err || !validPackagesfilled) return;
      values.description = values.description?.trim();
      values.url = values.url?.trim();
      values.urlForGpu = values.urlForGpu?.trim();
      if (values.imageSpec?.packages) {
        const packages = values.imageSpec.packages;
        packages.apt = this.trimPackages(packages.apt);
        packages.conda = this.trimPackages(packages.conda);
        packages.pip = this.trimPackages(packages.pip);
      }
      onSubmit(values);
    });
  }

  rebuild = e => {
    const {form, onRebuild} = this.props;
    e.preventDefault();
    let validPackagesfilled = true;
    if (this.state.buildType === BuildType.CUSTOM) {
      validPackagesfilled = this.validatePackagesFilled(form);
    }
    form.validateFields(async (err, values: FormValue) => {
      if (err || !validPackagesfilled) return;
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

  renderBuildCustomImageForm = () => {
    // form, formType, url, isReady, jobStatus, imageSpec: any = {}, packages = {}
    const { form, formType, initialValue, availableImages} = this.props;
    const { url, isReady, jobStatus, imageSpec } = initialValue || {};
    const { packages } = imageSpec || {};
    if (formType === FormType.Edit) {
      return (
        <StyledFormItem
          label={<span>Container Image URL : {this.renderBuildingLink(isReady, get(jobStatus, 'phase', ''))}</span>}
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
       <BuildCustomImageForm
         form={form}
         imageSpec={imageSpec}
         packages={packages}
         availableImages={availableImages}
       />
      );
    }
  }

  render() {
    const {
      refetchGroup,
      loading,
      form,
      initialValue,
      formType,
      availableImages
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
    const urlForGpu = formType !== FormType.Edit || !this.state.showGpuUrl || (initialValue.url === initialValue.urlForGpu) ? null : initialValue.urlForGpu;
    const { packages } = imageSpec || {};
    const { buildModalVisible } = this.state;
    const imageReady = this.buildModalEditable(isReady, jobStatus);
    return (
      <Form onSubmit={this.submit}>
        <Row>
          <Col>
            <Card loading={loading} style={{overflow: 'auto'}}>
              <Form.Item label={`Display Name`} style={{marginBottom: '8px'}}>
                {form.getFieldDecorator('displayName', {
                  initialValue: displayName,
                  rules: [
                    {
                      whitespace: true,
                      required: true,
                      message: 'Please input a name!'
                    },
                    {
                      pattern: /^[a-zA-Z0-9][a-zA-Z0-9\s-_]*[a-zA-Z0-9]$/,
                      message: `alphanumeric characters, '-' or '_' , and must start and end with an alphanumeric character.`
                    }
                  ],
                })(
                  <Input onChange={this.handleNameChange} />
                )}
              </Form.Item>
              <Form.Item label={`Image Name`}>
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
              {(DISABLE_BUILD_IMAGE) ? (
                <Alert
                  message='Warning'
                  description={<span>Image registry not found. Please set up your image registry using Image Builder. <a href='https://docs.primehub.io/docs/getting_started/configure-image-builder' target='_blank'>More Info.</a></span>}
                  type='warning'
                  showIcon
                />
              ) : (<></>)}
              <Form.Item>
                <Radio.Group
                  disabled={formType === FormType.Edit}
                  onChange={this.handleBuildingType}
                  value={this.state.buildType}>
                  <Radio value={BuildType.EXIST}>
                    Use Existing One
                  </Radio>
                  <Radio value={BuildType.CUSTOM} disabled={DISABLE_BUILD_IMAGE}>
                    Build Custom Image
                  </Radio>
                </Radio.Group>
              </Form.Item>
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
                    <Option key='cpu' value='cpu'>CPU</Option>
                    <Option key='gpu' value='gpu'>GPU</Option>
                    <Option key='both' value='both'>Universal</Option>
                  </Select>
                )}
              </Form.Item>
              {
                this.state.buildType === BuildType.CUSTOM ? this.renderBuildCustomImageForm()
                  : (
                  <>
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item label='Container Image URL' style={{marginBottom: '12px'}}>
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
                            Specific Container Image URL for GPU
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
                      type='primary'
                      htmlType='submit'
                      style={{marginRight: 16, width: '100%'}}
                    >
                      Confirm
                    </InfuseButton>
                    <InfuseButton onClick={this.cancel} style={{width: '100%'}}>
                      Cancel
                    </InfuseButton>
                  </>
                ) : (
                  <InfuseButton type='primary' htmlType='submit' style={{width: '100%'}}>
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
            width='calc(100% - 128px)'
            style={{marginLeft: '64px'}}
            footer={null}
            visible={this.state.buildModalVisible}
            onCancel={this.hideBuildingModal}>
            <div>
              <Tabs defaultActiveKey='details'>
                <TabPane tab='Build Details' key='details'>
                  <BaseImageRow
                    form={form}
                    imageSpec={imageSpec}
                    disabled={!isReady}
                    availableImages={availableImages}
                  />
                  <Form.Item label='Status' style={{marginBottom: '12px'}}>
                    <Input disabled value={get(jobStatus, 'phase', 'Unknow')} />
                  </Form.Item>
                  <Form.Item label='Package(s)' required={true}>
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
    );
  }
}

export default Form.create<Props>()(ImageCreateForm);
