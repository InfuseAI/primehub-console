import * as React from 'react';
import {Button, Radio, Select, Form, Card, Divider, Row, Col, Input, Tooltip, Icon} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get, startCase} from 'lodash';
import RecurrenceInput, {RecurrenceType, recurrenceValidator} from 'components/schedule/recurrence';
import Message from 'components/job/message';

const { Option } = Select;

type Props = FormComponentProps & {
  groups: Array<Record<string, any>>;
  onSelectGroup: Function;
  selectedGroup: string;
  instanceTypes: Array<Record<string, any>>;
  images: Array<Record<string, any>>;
  onSubmit: Function;
  onCancel?: Function;
  loading: boolean;
  initialValue?: any;
  type?: 'schedule' | 'job';
  timezone?: {
    name: string;
    offset: number;
  }
};

type State = {
  recurrenceError: string;
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

class CreateForm extends React.Component<Props, State> {
  state = {
    recurrenceError: ''
  };

  componentDidMount() {
    const {initialValue} = this.props;
    if (!initialValue) {
      this.autoSelectFirstGroup();
      this.autoSelectFirstInstanceType();
      this.autoSelectFirstImage();
    }
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

    const recurrence = form.getFieldValue('recurrence');
    if (recurrence.type !== 'inactive' && !recurrence.cron) {
      return this.setState({
        recurrenceError: 'Please input cron expression!'
      });
    }

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

  stringifyZone(zone, offset): string {
    const ensure2Digits = num => (num > 9 ? `${num}` : `0${num}`);

    return `${offset}${zone.offset < 0 ? '-' : '+'}${ensure2Digits(Math.floor(Math.abs(zone.offset)))}:${ensure2Digits(Math.abs((zone.offset % 1) * 60))}, ${zone.name}`;
  }

  renderLabel = (defaultLabel: string, invalid: boolean, message: any) => {
    let label = <span>{defaultLabel}</span>;
    if (invalid)
      label = <span>
        {defaultLabel} <span style={{color: 'red'}}>({message})</span>
      </span>
    return label;
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
      initialValue,
      timezone,
      selectedGroup,
    } = this.props;
    const {
      recurrenceError
    } = this.state;
    const instanceType = instanceTypes.find(instanceType => instanceType.id === form.getFieldValue('instanceType'));
    const {
      groupId,
      groupName,
      instanceTypeId,
      instanceTypeName,
      image,
      displayName,
      command,
      recurrence = {},
      invalid,
      message,
    } = initialValue || {};
    let recurrenceLabel = `Recurrence Options`;
    if (timezone) {
      recurrenceLabel += `(${this.stringifyZone(timezone, 'GMT')})`;
    }

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

    const invalidInitialImage = !invalidInitialGroup &&
      image &&
      !form.getFieldValue('image') &&
      !images.find(it => it.id === image);
    const imageLabel = this.renderLabel(
      'Images',
      invalidInitialImage,
      <span>The image <b>{image}</b> was deleted.</span>
    )

    return (
      <Form onSubmit={this.submit}>
        <Row gutter={16}>
          <Col xs={24} sm={8} lg={8}>
            <Card loading={loading} style={{overflow: 'auto'}}>
              <h3>Environment Settings</h3>
              <Divider />
              {
                groups.length ? (
                  <Form.Item label={groupLabel}>
                    {form.getFieldDecorator('groupId', {
                      initialValue: invalidInitialGroup ? '' : groupId,
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

              <Form.Item label={instanceTypeLabel}>
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

              <Form.Item label={imageLabel}>
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
                  <Form.Item
                    label={recurrenceLabel}
                    validateStatus={recurrenceError ? "error" : undefined}
                    help={recurrenceError ? recurrenceError : undefined}
                  >
                    {form.getFieldDecorator('recurrence', {
                      initialValue: {type: RecurrenceType.Inactive, ...recurrence},
                      rules: [
                        { validator: recurrenceValidator }],
                    })(
                      <RecurrenceInput onChange={() => this.setState({recurrenceError: ''})} />
                    )}
                  </Form.Item>
                )
              }
              {
                type === 'schedule' && invalid && (
                  <Form.Item label="Message">
                    <Message text={message} />
                  </Form.Item>
                )
              }
            </Card>
            <Form.Item style={{textAlign: 'right', marginRight: 8, marginTop: 24}}>
              {
                initialValue ? (
                  <>
                    <Button
                      type="primary"
                      htmlType="submit"
                      style={{marginRight: 8}}
                    >
                      Confirm
                    </Button>
                    <Button onClick={this.cancel}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button type="primary" htmlType="submit">
                    Submit
                  </Button>
                )
              }
            </Form.Item>
          </Col>
        </Row>
      </Form>
    )
  }
}


export default Form.create<Props>()(CreateForm);
