import * as React from 'react';
import {Checkbox, Button, Radio, Select, Form, Card, Divider, Row, Col, Input, Tooltip, Icon, InputNumber, Switch} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get, snakeCase, debounce, isEmpty} from 'lodash';
import DynamicFields from 'components/share/dynamicFields';
import EnvFields from 'components/share/envFields';
import InfuseButton from 'components/infuseButton';
import ImagePullSecret from 'components/share/ImagePullSecret';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';

enum FormType {
  Edit = 'edit',
  Create = 'create'
}

enum ImageType {
  CPU = 'cpu',
  GPU = 'gpu',
  ALL = 'both'
}

const { Option } = Select;

type Props = FormComponentProps & {
  groupContext: any;
  refetchGroup: Function;
  groups: Array<Record<string, any>>;
  selectedGroup: string;
  instanceTypes: Array<Record<string, any>>;
  onSubmit: Function;
  onCancel?: Function;
  loading: boolean;
  initialValue?: any;
  formType?: FormType;
};

type State = {
  showGpuUrl: boolean
  imageType: ImageType
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
  displayName: string;
  name: string;
  id: string;
  type: string;
  useImagePullSecret: string;
  description: string;
  url: string;
  urlForGpu: string;
};

const dashOrNumber = value => value === null ? '-' : value;

const autoGenId = (name: string) => {
  const normalizedNAme = name.replace(/[\W_]/g, '-').toLowerCase();
  const randomString = Math.random().toString(36).substring(7).substring(0, 5);
  return `${normalizedNAme}-${randomString}`;
}

class ImageCreateForm extends React.Component<Props, State> {
  constructor (props) {
    super(props);
    const {formType, initialValue} = props;
    this.state = {
      showGpuUrl: formType === FormType.Edit && (!isEmpty(initialValue.urlForGpu) && initialValue.url !== initialValue.urlForGpu),
      imageType: (initialValue && initialValue.type) || ImageType.ALL
    }
  }

  componentDidMount() {
  }

  submit = (e) => {
    const {form, onSubmit} = this.props;
    e.preventDefault();
    form.validateFields(async (err, values: FormValue) => {
      if (err) return;
      onSubmit(values);
    });
  }

  cancel = () => {
    const {form, onCancel} = this.props;
    if (!onCancel) return;
    const values = form.getFieldsValue();
    onCancel(values);
  }

  handleGpuVisible = (e) => {
    this.setState({showGpuUrl: e.target.checked});
  }

  renderLabel = (defaultLabel: string, invalid: boolean, message: any) => {
    let label = <span>{defaultLabel}</span>;
    if (invalid)
      label = <span>
        {defaultLabel} <span style={{color: 'red'}}>({message})</span>
      </span>
    return label;
  }

  handleTypeChange = (value) => {
    const {form} = this.props;
    const type = value;
    this.setState({imageType: type});
    form.setFieldsValue({ type });
  }

  handleNameChange = debounce(() => {
    const {form, formType} = this.props;
    // Don't change name(id) in edit mode.
    if (formType === FormType.Edit) return;
    const values = form.getFieldsValue();
    form.validateFields(['displayName'], (err, values) => {
      if (err) return form.setFieldsValue({ id: '' });
      const name = autoGenId(values.displayName);
      form.setFieldsValue({ name });
    });

  }, 400)

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
    } = initialValue || {};
    let urlForGpu = formType !== FormType.Edit || !this.state.showGpuUrl || (initialValue.url == initialValue.urlForGpu) ? null : initialValue.urlForGpu;
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
              <Form.Item label="Description">
                {form.getFieldDecorator('description', {
                  initialValue: description
                })(
                  <Input />
                )}
              </Form.Item>
              <Form.Item label="Type">
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
                    <Select.Option key='cpu' value='cpu'>cpu</Select.Option>
                    <Select.Option key='gpu' value='gpu'>gpu</Select.Option>
                    <Select.Option key='both' value='both'>universal</Select.Option>
                  </Select>
                )}
              </Form.Item>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="Container image url" style={{marginBottom: '12px'}}>
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
                    <Checkbox style={{color: '#000000D9'}} checked={this.state.showGpuUrl} onChange={this.handleGpuVisible}>
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
            </Card>
            <Form.Item style={{textAlign: 'right', marginTop: 12}}>
              {
                formType === 'edit' ? (
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
      </Form>
    )
  }
}


export default Form.create<Props>()(ImageCreateForm);
