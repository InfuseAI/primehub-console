import React from 'react';
import { isNull } from 'lodash';
import { Form, Row, Col, Card, Input, InputNumber, Checkbox, Switch } from 'antd';

interface Props {
  group: any;
}

const inputNumberStyle = {
  width: 193,
};

const checkboxStyle = {
  marginRight: 8,
};

export default class GroupSettingsInfo extends React.Component<Props> {

  renderInfoQuotaFormItem(title, value, params) {
    return (
      <Form.Item label={title} >
        <div style={{alignItems: 'center'}}>
          <Checkbox style={checkboxStyle} checked={!isNull(value)} disabled />
          {
            isNull(value) ? (
              <Input style={inputNumberStyle}
                value={'unlimited'}
                disabled />
            ) : (
              <InputNumber style={inputNumberStyle}
                min={params && params.min}
                step={params && params.step}
                precision={params && params.precision}
                formatter={value => `${value}${params && params.unit ? params.unit : ''}`}
                value={value}
                disabled />
            )
          }
        </div>
      </Form.Item>
    );
  }

  renderInfoQuotaCard(title: string, quota) {
    return (
      <Card title={title}>
        <Row>
          <Col sm={8} xs={24}>
            {this.renderInfoQuotaFormItem('CPU Quota', quota.cpu, {min: 0.5, step: 0.5, percision: 1})}
          </Col>
          <Col sm={8} xs={24}>
            {this.renderInfoQuotaFormItem('GPU Quota', quota.gpu, {min: 0, step: 1, percision: 0})}
          </Col>
          <Col sm={8} xs={24}>
            {this.renderInfoQuotaFormItem('Memory Quota', quota.memory, {min: 0, step: 1, precision: 1, unit: ' GB'})}
          </Col>
        </Row>
      </Card>
    );
  }

  render() {
    const {group} = this.props;

    if (!group) {
      return (<div>loading...</div>);
    }

    return (
      <>
        <Row style={{marginTop: 5}}>
          <Col>
            <Form.Item label={`Name`} style={{marginBottom: 20}}>
              <Input disabled value={group.name} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`Display Name`} style={{marginBottom: 20}}>
              <Input disabled value={group.displayName} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`Model Deployment`} style={{marginBottom: 20}}>
              <Switch disabled checked={group.enabledDeployment} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            {
              this.renderInfoQuotaFormItem('Maximum Deployment(s)', group.maxDeploy, {min: 0, step: 1, percision: 1})
            }
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`Shared Volume`} style={{marginBottom: 20}}>
              <Switch disabled checked={group.enabledSharedVolume} />
              {group.enabledSharedVolume ?
                <Card title={`Shared Volume`} style={{marginTop: 10}}>
                  <Row>
                    <Col sm={8} xs={24}>
                      <Form.Item label={`Shared Volume Capacity`}>
                        <InputNumber
                          style={{width: 'auto'}}
                          formatter={value => `${value} GB`}
                          value={group.sharedVolumeCapacity}
                          disabled
                        />
                      </Form.Item>
                    </Col>
                    <Col sm={8} xs={24}>
                      <Form.Item label={`Launch Group Only`}>
                        <Switch
                          checked={group.launchGroupOnly}
                          checkedChildren="yes"
                          unCheckedChildren="no"
                          disabled
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              : <></>}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            {
              this.renderInfoQuotaCard('User Quota', {
                cpu: group.quotaCpu,
                gpu: group.quotaGpu,
                memory: group.quotaMemory,
              })
            }
          </Col>
        </Row>
        <Row style={{marginTop: 20, marginBottom: 5}}>
          <Col>
            {
              this.renderInfoQuotaCard('Group Quota', {
                cpu: group.projectQuotaCpu,
                gpu: group.projectQuotaGpu,
                memory: group.projectQuotaMemory,
              })
            }
          </Col>
        </Row>
      </>
    );
  }
}
