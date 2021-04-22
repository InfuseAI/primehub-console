import React from 'react';
import { Form, Row, Col, Card, Input, InputNumber, Checkbox, Switch } from 'antd';
import InfuseButton from 'components/infuseButton';
import EnvFields from 'components/share/envFields';

class GroupSettingsMLflow extends React.Component {
  render() {
    return (
      <>
        <Row style={{marginTop: 5}}>
          <Col>
            <Form.Item label={`MLflow Tracking URI`} style={{marginBottom: 20}}>
              <Input/>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`MLflow UI URI`} style={{marginBottom: 20}}>
              <Input/>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`Tracking Environment Variables`} style={{marginBottom: 20}}>
              <EnvFields onChange={()=>{}}/>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item label={`Artifact Store Environment Variables`} style={{marginBottom: 20}}>
              <EnvFields onChange={()=>{}}/>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Item style={{textAlign: 'right', marginTop: 12}}>
              <InfuseButton type='primary' htmlType='submit' style={{width: '100%'}}>
                Save
              </InfuseButton>
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  }
}

export default GroupSettingsMLflow;
