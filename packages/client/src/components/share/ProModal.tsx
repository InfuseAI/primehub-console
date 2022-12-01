import React from 'react';
import styled from 'styled-components';
import {
  Button,
  Modal,
  Card,
  Row,
  Col,
  Icon,
} from 'antd';

const ExModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 10px;
    background-color: #f0f6fd;
  }
  .ant-modal-header {
    background-color: #f0f6fd;
    border-bottom: none;
    border-radius: 10px;
  }
  .ant-modal-title {
    font-weight: 200 !important;
    font-size: 20px;
    color: #4e77cf;
  }

  .ant-modal-body {
    padding: 24px 48px 42px;
    border-radius: 10px;
  }

  .ant-card {
    box-shadow: #6282e64a 1px 1px 24px 0;
  }

  .ant-card-head-title {
    font-weight: 300;
    color: #4e77cf;
  }

  .ant-card-body {
    padding: 24px 32px;
  }
`;

const ActionRow = styled.div`
  margin-top: 20px;
  text-align: center;
  .ant-btn {
    width: 140px;
    padding: 0 auto;
    font-weight: 700;
    font-size: 11px;
  }
  .find-out-more {
    font-size: 10px;
  }
`;

const CurrentRow = styled(ActionRow)`
  .ant-btn {
    color: #5b7cc9 !important;
    background-color: #fff !important;
    border-width: 2px !important;
    border-color: #5b7cc9 !important;
  }
`;

const ProModal = (props: any) => {
  const { visible, onOk, onCancel } = props;
  const ceFeatures = ['Notebook', 'Shared Files', 'Apps'];
  const eeFeatures = ['Jobs', 'Recurring Jobs', 'Models', 'Deployments'];
  const FeatureItem = (props: any) => {
    const { children, key, available } = props;
    return (
      <p key={key}>
        <Icon
          type={available ? 'check-circle' : 'close-circle'}
          theme='filled'
          style={{
            marginLeft: 16,
            color: `${available ? '#00cb5d' : '#ff3845'}`,
          }}
        />{' '}
        <span style={{ marginLeft: 8 }}>{children}</span>
      </p>
    );
  };

  return (
    <ExModal
      width={550}
      title='Upgrade to Enterprise Edition'
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
      footer={null}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Row>
            <Card
              title='Community Edition'
              headStyle={{
                textAlign: 'center',
                fontWeight: 200,
              }}
            >
              {ceFeatures.map((text, index) => (
                <FeatureItem key={`ce-${index}`} available={true}>
                  {text}
                </FeatureItem>
              ))}
              {eeFeatures.map((text, index) => (
                <FeatureItem key={`ee-${index}`} available={false}>
                  {text}
                </FeatureItem>
              ))}
              <CurrentRow>
                <Button
                  shape='round'
                  style={{ cursor: 'default', marginBottom: 21 }}
                >
                  CURRENT
                </Button>
              </CurrentRow>
            </Card>
          </Row>
        </Col>
        <Col span={12}>
          <Card
            title='Enterprise Edition'
            headStyle={{
              textAlign: 'center',
              fontWeight: 200,
            }}
          >
            {ceFeatures.concat(eeFeatures).map((text, index) => (
              <FeatureItem key={`ee-${index}`} available={true}>
                {text}
              </FeatureItem>
            ))}
            <ActionRow>
              <Button
                shape='round'
                type='primary'
                href='https://www.infuseai.io/request-demo'
                target='_blank'
              >
                TRIAL
              </Button>
              <div>
                <a
                  className='find-out-more'
                  href='https://docs.primehub.io/docs/comparison'
                  target='_blank'
                >
                  Find out more
                </a>
              </div>
            </ActionRow>
          </Card>
        </Col>
      </Row>
    </ExModal>
  );
};

export default ProModal;
