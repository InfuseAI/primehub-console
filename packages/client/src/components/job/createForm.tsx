import * as React from 'react';
import {Button, Radio, Select, Form, Card, Divider, Row, Col, Input, Tooltip, Icon} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get, startCase} from 'lodash';
import RecurrenceInput, {RecurrenceType, recurrenceValidator} from 'components/schedule/recurrence';

const { Option } = Select;

type Props = FormComponentProps & {
  groups: Array<Record<string, any>>;
  onSelectGroup: Function;
  selectedGroup: string;
  instanceTypes: Array<Record<string, any>>;
  images: Array<Record<string, any>>;
  onSubmit: Function;
  loading: boolean;
  initialValue?: any;
  type?: 'schedule' | 'job';
  timezone?: {
    name: string;
    offset: number;
  }
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
  image: string;
  displayName: string;
  command: string;
  recurrence: {
    cron: string;
    type: RecurrenceType;
  }
};

const transformImages = (images, instanceType) => {
  const gpuInstance = Boolean(instanceType && instanceType.gpuLimit);
  return images.map(image => {
    return {
      ...image,
      __disabled: !gpuInstance && (image.type || '').toLowerCase() === 'gpu'
    };
  });
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
  --parameter_2 value_2
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
    const {onSelectGroup, selectedGroup, groups, form} = this.props;
    if (!selectedGroup && groups.length) {
      const id = get(groups[0], 'id', null);
      onSelectGroup(id);
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

  autoSelectFirstImage = () => {
    const {images, instanceTypes, form} = this.props;
    const instanceTypeId = form.getFieldValue('instanceType');
    const imageId = form.getFieldValue('image');
    const instanceType = instanceTypes.find(it => it.id === instanceTypeId);
    const transformedImages = transformImages(images, instanceType);
    const availableImages = transformedImages.filter(image => !image.__disabled);
    if (imageId && availableImages.some(image => image.id === imageId)) return;
    if (availableImages.length) form.setFieldsValue({image: availableImages[0].id});
  }

  submit = (e) => {
    const {form, onSubmit} = this.props;
    e.preventDefault();

    form.validateFields(async (err, values: FormValue) => {
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
      form,
      type,
      initialValue = {},
      timezone,
    } = this.props;
    const instanceType = instanceTypes.find(instanceType => instanceType.id === form.getFieldValue('instanceType'));
    const {
      groupId,
      instanceTypeId,
      image,
      displayName,
      command,
      recurrence = {},
    } = initialValue;
    let recurrenceLabel = `Recurrence Options`;
    if (timezone) {
      recurrenceLabel += ` (GMT${timezone.offset}, ${timezone.name})`;
    }
    return (
      <Form onSubmit={this.submit}>
        <Row gutter={16}>
          <Col xs={24} sm={8} lg={8}>
            <Card loading={loading}>
              <h3>Environment Settings</h3>
              <Divider />
              {
                groups.length ? (
                  <Form.Item label="Group">
                    {form.getFieldDecorator('groupId', {
                      initialValue: groupId,
                      rules: [{ required: true, message: 'Please select a group!' }],
                    })(
                      <Select placeholder="Please select a group" onChange={id => onSelectGroup(id)}>
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

              <Form.Item label="InstanceTypes">
                {form.getFieldDecorator('instanceType', {
                  initialValue: instanceTypeId,
                  rules: [{ required: true, message: 'Please select a instance type!' }],
                })(
                  instanceTypes.length ? (
                    <Radio.Group style={radioGroupStyle} onChange={this.autoSelectFirstImage}>
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

              <Form.Item label="Images">
                {form.getFieldDecorator('image', {
                  initialValue: image,
                  rules: [{ required: true, message: 'Please select a image!' }],
                })(
                  images.length ? (
                    <Radio.Group style={radioGroupStyle}>
                      {transformImages(images, instanceType).map(image => (
                        <Radio key={image.id} style={radioStyle} value={image.id} disabled={image.__disabled}>
                          <div style={radioContentStyle}>
                            <h4>{image.displayName || image.name} ({getImageType(image)})</h4>
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
              <h3>{startCase(type || 'job')} Details</h3>
              <Divider />
              <Form.Item label={`${startCase(type || 'job')} name`}>
                {form.getFieldDecorator('displayName', {
                  initialValue: displayName,
                  rules: [
                    { whitespace: true, required: true, message: 'Please input a name!' },
                  ],
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
                  initialValue: command,
                  rules: [{ required: true, message: 'Please input commands!' }],
                })(
                  <Input.TextArea
                    placeholder={commandPlaceHolder}
                    rows={10}
                  />
                )}
              </Form.Item>
              {
                type === 'schedule' && (
                  <Form.Item label={recurrenceLabel}>
                    {form.getFieldDecorator('recurrence', {
                      initialValue: {type: RecurrenceType.Inactive, ...recurrence},
                      rules: [
                        { required: true },
                        { validator: recurrenceValidator }],
                    })(
                      <RecurrenceInput />
                    )}
                  </Form.Item>
                )
              }
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


export default Form.create<Props>()(CreateForm);
