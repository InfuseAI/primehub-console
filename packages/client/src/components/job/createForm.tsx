import * as React from 'react';
import {Button, Radio, Select, Form, Card, Divider, Row, Col, Input, Tooltip, Icon} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get} from 'lodash';

const { Option } = Select;

type Props = FormComponentProps & {
  groups: Array<Record<string, any>>;
  onSelectGroup: Function;
  selectedGroup: string;
  instanceTypes: Array<Record<string, any>>;
  images: Array<Record<string, any>>;
  onSubmit: Function;
  creatingJob: boolean;
  loading: boolean;
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

const compareByAlphabetical = (prev, next) => {
  if(prev < next) return -1;
  if(prev > next) return 1;
  return 0;
}

const sortGroups = (groups) => {
  const copiedGroups = groups.slice();
  copiedGroups
    .sort((prev, next) => {
      const prevName = prev.displayName || prev.name;
      const nextName = next.displayName || next.name;
      return compareByAlphabetical(prevName, nextName);
    });
  return copiedGroups;
}

const sortInstanceTypes = (instanceTypes) => {
  const copiedInstanceTypes = instanceTypes.slice();
  copiedInstanceTypes
    .sort((prev, next) => {
      const prevName = prev.displayName || prev.name;
      const nextName = next.displayName || next.name;
      return compareByAlphabetical(prevName, nextName);
    });
  return copiedInstanceTypes;
}

const transformImages = (images, instanceType) => {
  const gpuInstance = Boolean(instanceType && instanceType.gpuLimit);
  const transformedImages = images.map(image => {
    return {
      ...image,
      __disabled: !gpuInstance && (image.type || '').toLowerCase() === 'gpu'
    };
  });
  transformedImages
    .sort((prev, next) => {
      const prevName = prev.displayName || prev.name;
      const nextName = next.displayName || next.name;
      return compareByAlphabetical(prevName, nextName);
    });
  return transformedImages;
}

const getImageType = (image) => {
  const imageType = (image.type || '').toLowerCase();
  switch (imageType) {
    case 'gpu':
      return 'GPU';
    case 'cpu':
      return 'CPU';
    case 'both':
      return 'Universal'
    default:
      return 'Unknown';
  }
}

const dashOrNumber = value => value === null ? '-' : value;

const commandPlaceHolder = `echo "Start training"
python /project/group-a/train.py \\
  --dataset /datasets/dataset-a/train.txt \\
  --output /workingdir/output \\
  --parameter_1 value_1 \\
  --parameter_1 value_2 \\
`;

class CreateForm extends React.Component<Props> {
  componentDidMount() {
    this.autoSelectFirstGroup();
    this.autoSelectFirstInstanceType();
    this.autoSelectFirstImage();
  }

  componentDidUpdate() {
    this.autoSelectFirstGroup();
    this.autoSelectFirstInstanceType();
    this.autoSelectFirstImage();
  }

  autoSelectFirstGroup = () => {
    const {onSelectGroup, selectedGroup, groups} = this.props;
    if (!selectedGroup && groups.length) onSelectGroup(get(groups[0], 'id', null));
  }

  autoSelectFirstInstanceType = () => {
    const {instanceTypes, form} = this.props;
    if (!form.getFieldValue('instanceType') && instanceTypes.length) {
      form.setFieldsValue({instanceType: instanceTypes[0].id});
    }
  }

  autoSelectFirstImage = () => {
    const {images, instanceTypes, form} = this.props;
    const instanceTypeId = form.getFieldValue('instanceType');
    const imageId = form.getFieldValue('image');
    const instanceType = instanceTypes.find(it => it.id === instanceTypeId);
    const transformedImages = transformImages(images, instanceType);
    const availableImages = transformedImages.filter(image => !image.disabled);
    if (imageId && availableImages.some(image => image.id === imageId)) return;
    if (availableImages.length) form.setFieldsValue({image: availableImages[0].id});
  }

  submit = (e) => {
    const {form, onSubmit} = this.props;
    e.preventDefault();

    form.validateFields(async (err, values) => {
      if (err) return;
      onSubmit(values);
    });
  }

  render() {
    const {
      groups,
      onSelectGroup,
      instanceTypes,
      images,
      loading,
      creatingJob,
      form
    } = this.props;

    const instanceType = instanceTypes.find(instanceType => instanceType.id === form.getFieldValue('instanceType'));
    return (
      <Form onSubmit={this.submit}>
        <Row gutter={16}>
          <Col xs={24} sm={8} lg={8}>
            <Card loading={loading || creatingJob}>
              <h3>Select your notebook setting</h3>
              <Divider />
              {
                groups.length ? (
                  <Form.Item label="Group">
                    {form.getFieldDecorator('groupId', {
                      rules: [{ required: true, message: 'Please select a group!' }],
                    })(
                      <Select placeholder="Please select a group" onChange={id => onSelectGroup(id)}>
                        {sortGroups(groups).map(group => (
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

              <Form.Item label="InstanceTypes">
                {form.getFieldDecorator('instanceType', {
                  rules: [{ required: true, message: 'Please select a instance type!' }],
                })(
                  instanceTypes.length ? (
                    <Radio.Group style={radioGroupStyle} onChange={this.autoSelectFirstImage}>
                      {sortInstanceTypes(instanceTypes).map(instanceType => (
                        <Radio style={radioStyle} value={instanceType.id}>
                          <div style={radioContentStyle}>
                            <h4>
                              {instanceType.displayName || instanceType.name}
                              <Tooltip
                                title={`CPU: ${dashOrNumber(instanceType.cpuRequest)} / Memory: ${dashOrNumber(instanceType.memoryRequest)} G / GPU: ${dashOrNumber(instanceType.gpuLimit)}`}
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

              <Form.Item label="Images">
                {form.getFieldDecorator('image', {
                  rules: [{ required: true, message: 'Please select a image!' }],
                })(
                  images.length ? (
                    <Radio.Group style={radioGroupStyle}>
                      {transformImages(images, instanceType).map(image => (
                        <Radio style={radioStyle} value={image.id} disabled={image.disabled}>
                          <div style={radioContentStyle}>
                            <h4>{image.displayName || image.name}({getImageType(image)})</h4>
                            {image.description}
                          </div>
                        </Radio>
                      ))}
                    </Radio.Group>
                  ) : (
                    <Card>
                      No image in this group.
                    </Card>
                  )
                )}
              </Form.Item>
              
            </Card>
          </Col>
          <Col xs={24} sm={16} lg={16}>
            <Card>
              <Form.Item label="Job name">
                {form.getFieldDecorator('displayName', {
                  rules: [{ required: true, message: 'Please input a name!' }],
                })(
                  <Input />
                )}
              </Form.Item>
              <Form.Item label={(
                <span>
                  Command&nbsp;
                  <Tooltip title={(
                    <React.Fragment>
                      <h4 style={{color: 'white'}}>Information</h4>
                      <div>{`Commands allow multiline. The working directory is located at '/workingdir'. The group volume is mounted at '/project/<group>' and datasets are mounted at '/datasets/<dataset>'.`}</div>
                    </React.Fragment>
                  )}>
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </span>
              )} >
                {form.getFieldDecorator('command', {
                  rules: [{ required: true, message: 'Please input commands!' }],
                })(
                  <Input.TextArea
                    placeholder={commandPlaceHolder}
                    rows={10}
                  />
                )}
              </Form.Item>
            </Card>
            <Form.Item style={{textAlign: 'right', marginRight: 8, marginTop: 24}}>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    )
  }
}


export default Form.create<Props>({
  mapPropsToFields(props) {
    return {
      groupId: Form.createFormField({
        value: props.selectedGroup,
      })
    };
  },
})(CreateForm);