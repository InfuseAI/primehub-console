import * as React from 'react';
import {Button, Radio, Select, Form, Card, Divider, Row, Col, Input, Tooltip, Icon, InputNumber, Switch, AutoComplete} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get, snakeCase, debounce} from 'lodash';
import DynamicFields from 'components/share/dynamicFields';
import EnvFields from 'components/share/envFields';
import InfuseButton from 'components/infuseButton';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';
import { PhAppTemplate } from 'containers/appCreatePage';
import defaultLogo from 'images/icon-apps.svg';
import styled from 'styled-components';

const AppSelect = styled(Select)`
  .ant-select-selection-selected-value {
    width: 100%;
  }
`;

const { Option } = Select;

type Props = FormComponentProps & {
  groupContext: any;
  refetchGroup: ({}?) => void;
  phAppTemplates: PhAppTemplate[];
  instanceTypes: Array<Record<string, any>>;
  onSubmit: ({}) => void;
  onCancel?: ({}) => void;
  loading: boolean;
  initialValue?: any;
  type?: 'edit' | 'create';
};

interface State {
  revealEnv: boolean;
  appSearchText: string;
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

interface FormValue {
  groupId: string;
  instanceType: string;
  name: string;
  id: string;
  appName: string;
  env: Array<{name: string, value: string}>;
  metadata: object;
  description: string;
  updateMessage: string;
  replicas: number;
  privateAccess: boolean;
}

const dashOrNumber = value => value === null ? '-' : value;

const autoGenId = (name: string) => {
  const normalizedNAme = name.replace(/[\W_]/g, '-').toLowerCase();
  const randomString = Math.random().toString(36).substring(7).substring(0, 5);
  return `${normalizedNAme}-${randomString}`;
};

class AppCreateForm extends React.Component<Props, State> {
  state = {
    recurrenceError: '',
    revealEnv: false,
    appSearchText: ''
  };

  componentDidMount() {
    const {initialValue} = this.props;
    if (!initialValue) {
      this.autoSelectFirstInstanceType();
    }
  }

  componentDidUpdate() {
    this.autoSelectFirstInstanceType();
  }

  autoSelectFirstInstanceType = () => {
    const {instanceTypes, form} = this.props;
    const currentInstanceType = form.getFieldValue('instanceType');
    const validInstanceType = instanceTypes.some(instanceType => instanceType.id === currentInstanceType);
    if ((!form.getFieldValue('instanceType') || !validInstanceType) && instanceTypes.length) {
      form.setFieldsValue({instanceType: instanceTypes[0].id});
    }
  }

  submit = e => {
    const {form, onSubmit} = this.props;
    e.preventDefault();
    form.validateFields(async (err, values: FormValue) => {
      if (err) return;
      if (!values.metadata) values.metadata = {};
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
      </span>;
    return label;
  }

  handleNameChange = debounce(() => {
    const {form} = this.props;
    const values = form.getFieldsValue();
    form.validateFields(['templateId'], (err, val) => {
      if (err) return form.setFieldsValue({ id: '' });
      const id = autoGenId(val.templateId);
      form.setFieldsValue({ id });
    });

  }, 400);

  handleSelect = value => {
    this.setState({appSearchText: ''});
  }

  handleSearch = appSearchText => {
    this.setState({appSearchText});
  }

  render() {
    const {
      groupContext,
      refetchGroup,
      phAppTemplates,
      instanceTypes,
      loading,
      form,
      initialValue,
      type
    } = this.props;
    const {
      templateId,
      id,
      name,
      groupName,
      instanceType,
      scope,
      env,
    } = initialValue || {};
    const { revealEnv, appSearchText } = this.state;
    const showRevealBtn = !!(type === 'edit');

    const invalidInitialInstanceType = instanceType &&
      !form.getFieldValue('instanceType') &&
      !instanceTypes.find(it => it.id === instanceType);
    const instanceTypeLabel = this.renderLabel(
      'InstanceTypes',
      invalidInitialInstanceType,
      <span>The instance type <b>{instanceType}</b> was deleted.</span>
    );

    const revealBtn = (
      <span onClick={this.toggleEnvVisibilty} style={{cursor: 'pointer'}}>
        { revealEnv ? <Icon type='eye' title='Hide value' /> : <Icon type='eye-invisible' title='Show value' /> }
      </span>
    );

    const dataSource = phAppTemplates
    .map((template, i) => {
      const title = template.name;
      const description = template.description || '';
      const src = template.icon ? template.icon : defaultLogo;
      const index = title.toLowerCase().indexOf(appSearchText.toLowerCase());
      const descIndex = description.toLowerCase().indexOf(appSearchText.toLowerCase());
      const text = index >= 0 ? <span>
        {title.substr(0, index)}
        <b style={{
          background: '#faad14'
        }}>{title.substr(index, appSearchText.length)}</b>
        {title.substr(index + appSearchText.length)}
      </span> : title;
      const desc = descIndex >= 0 ? <span>
        {description.substr(0, descIndex)}
        <b style={{
          background: '#faad14'
        }}>{description.substr(descIndex, appSearchText.length)}</b>
        {description.substr(descIndex + appSearchText.length)}
      </span> : description;

      const label = (
          <Row>
            <Col span={2}>
              <span style={{
                display: 'inline-block',
                height: '20px',
                backgroundColor: src === defaultLogo ? 'rgb(215 222 242)' : null,
              }}><img src={src} height='100%'/></span>
            </Col>
            <Col span={22}>
              <span style={{fontWeight: 'bold'}}>{template.name}</span>
              <span
                style={
                  {
                    float: 'right',
                    fontWeight: 'bold',
                    clear: 'both'
                  }
                }
              >
                {template.version}
              </span>
            </Col>
          </Row>
      );

      return (
        <Option value={template.id} key={template.id} data-name={template.name} data-desc={template.description} data-label={label}>
          <Row>
            <Col span={2}>
              <span style={{
                display: 'inline-block',
                height: '36px',
                padding: '5px',
                lineHeight: '24px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: src === defaultLogo ? 'rgb(215 222 242)' : null,
              }}><img src={src} width='24px'/></span>
            </Col>
            <Col span={21}>
              <span style={{fontWeight: 'bold'}}>{text}</span>
              <span
                style={
                  {
                    float: 'right',
                    fontWeight: 'bold',
                    clear: 'both'
                  }
                }
              >
                {template.version}
              </span>
              <div
                style={{
                  display: '-webkit-box',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  whiteSpace: 'break-spaces'
              }}>
                {desc}
              </div>
            </Col>
            <Col span={1} style={{textAlign: 'center'}}>
              <a href={template.docLink} target='_blank'><Icon type='link'/></a>
            </Col>
          </Row>
        </Option>
      );
    });

    return (
      <Form onSubmit={this.submit}>
        <Row gutter={16}>
          <Col xs={24} sm={16} lg={16}>
            <Form.Item label={`Group Name`} style={ groupContext ? { display: 'none' } : {} }>
              {form.getFieldDecorator('groupName', {
                initialValue: groupName || groupContext.name,
              })(
                <Input disabled />
              )}
            </Form.Item>
            <Card loading={loading} style={{overflow: 'auto'}}>
              <Form.Item label={`App`}>
                {form.getFieldDecorator('templateId', {
                  rules: [
                    { whitespace: true, required: true, message: 'Please input an app name!' },
                  ],
                  initialValue: templateId
                })(
                  <AppSelect
                    showSearch
                    placeholder='Search to Select'
                    onSearch={this.handleSearch}
                    optionFilterProp='children'
                    optionLabelProp='data-label'
                    onSelect={this.handleSelect}
                    filterOption={(input, option) =>
                      option.props['data-name'].toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
                      option.props['data-desc'].toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {dataSource}
                  </AppSelect>
                )}
              </Form.Item>
              <Form.Item label={`App ID`}>
                {form.getFieldDecorator('id', {
                  initialValue: id
                })(
                  <Input disabled />
                )}
              </Form.Item>
              <Form.Item label={`Name`} style={{marginBottom: '8px'}}>
                {form.getFieldDecorator('displayName', {
                  initialValue: name,
                  rules: [
                    { whitespace: true, required: true, message: 'Please input a name!' },
                    { pattern: /^[a-zA-Z0-9][a-zA-Z0-9\s-_]*/, message: `alphanumeric characters, '-' or '_' , and must start with an alphanumeric character.`}
                  ],
                })(
                  <Input disabled={type === 'edit'} />
                )}
              </Form.Item>

              <Divider />
              <h3>Environment Variables { showRevealBtn === true ? revealBtn : null }</h3>
              <Form.Item >
                {form.getFieldDecorator('env', {
                  initialValue: env
                })(
                  <EnvFields empty={null} enableReveal={showRevealBtn} reveal={revealEnv} />
                )}
              </Form.Item>

              <Divider />
              <h3>Resources</h3>
              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item label={instanceTypeLabel}>
                    {form.getFieldDecorator('instanceType', {
                      initialValue: instanceType,
                    })(
                      instanceTypes.length ? (
                        <Radio.Group style={radioGroupStyle}>
                          {instanceTypes.map(it => (
                            <Radio style={radioStyle} value={it.name} key={it.id}>
                              <div style={radioContentStyle}>
                                <h4>
                                  {it.displayName || it.name}
                                  <Tooltip
                                    title={`CPU: ${dashOrNumber(it.cpuLimit)} / Memory: ${dashOrNumber(it.memoryLimit)} G / GPU: ${dashOrNumber(it.gpuLimit)}`}
                                  >
                                    <Icon
                                      type='info-circle'
                                      theme='filled'
                                      style={{marginLeft: 8}}
                                    />
                                  </Tooltip>
                                </h4>
                                {it.description}
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
              </Row>
              <Divider />
            </Card>
            <Form.Item style={{textAlign: 'right', marginTop: 12}}>
              {
                type === 'edit' ? (
                  <>
                    <InfuseButton
                      type='primary'
                      htmlType='submit'
                      style={{marginRight: 16, width: '100%'}}
                    >
                      Update
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
          <Col xs='24' sm='8' lg='8'>
            <ResourceMonitor
              selectedGroup={groupContext.id}
              groupContext={groupContext}
              refetchGroup={refetchGroup}
            />
          </Col>
        </Row>
      </Form>
    )
  }
}


export default Form.create<Props>()(AppCreateForm);
