import React from 'react';
import {Table, Modal, Row, Col, Tooltip} from 'antd';
import {renderTime, renderInstanceType} from 'ee/components/modelDeployment/detail';
import Field from 'components/share/field';
import {HistoryItem} from 'ee/components/modelDeployment/common';
import Metadata from 'ee/components/modelDeployment/metadata';
import moment from 'moment';
import styled from 'styled-components';

type Props = {
  history: Array<HistoryItem>;
}

type State = {
  historyItem: HistoryItem;
  visible: boolean;
}

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  msTextOverflow: 'ellipsis',
  display: 'block'
};

// https://github.com/facebookarchive/fixed-data-table/issues/454#issuecomment-246429599
const StyledTable = styled(Table as any)`
  td {
    position: relative;
  }

  .cell {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    box-sizing: border-box;
    display: block;
    padding: 8px 16px;
    width: 100%;
    vertical-align: bottom;
    display: flex;
    align-items: center;
  }

  .cell-overflow {
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
`;

export default class History extends React.Component<Props, State> {
  state = {
    historyItem: null,
    visible: false,
  }

  viewDetail = (historyItem: HistoryItem) => {
    this.setState({historyItem}, () => {
      this.setState({visible: true});
    });
  }

  closeDetail = () => {
    this.setState({
      visible: false
    }, () => {
      this.setState({historyItem: null});
    })
  }

  render() {
    const {history} = this.props;
    const {visible, historyItem} = this.state;
    const {deployment = {}, time} = historyItem || {};
    const columns = [{
      title: 'Description',
      dataIndex: 'deployment',
      key: 'description',
      width: 300,
      // ellipsis: true,
      render: deployment => (
        deployment.stop ? (
          <div>Deployment Stopped</div>
        ): (
          <Tooltip placement="topLeft" style={{...textOverflowStyle}} title={deployment.description}>
            <div className="cell">
              <div className="cell-overflow">
                {deployment.description || '-'}
              </div>
            </div>
          </Tooltip>
        )
      )
    }, {
      title: 'User',
      key: 'user',
      dataIndex: 'deployment.userName',
      width: '20%',
      render: userName => <span>{userName}</span>
    }, {
      title: 'Timestamp',
      key: 'time',
      width: '20%',
      dataIndex: 'time',
      render: time => <span>{time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-'}</span>
    }, {
      title: 'Clients',
      key: 'clients',
      width: '20%',
      dataIndex: 'deployment.endpointClients',
      render: clients => <span>{clients ? clients.map(client => client.name).join(", ") : '-'}</span>
    }, {
      title: 'Detail',
      width: '10%',
      key: 'detail',
      render: (historyItem) => <a onClick={() => this.viewDetail(historyItem)}>View</a>
    }]
    return (
      <div>
        <StyledTable
          dataSource={history}
          columns={columns}
          rowKey="id"
        />
        <Modal
          width="calc(100% - 128px)"
          style={{marginLeft: '64px'}}
          footer={null}
          visible={visible}
          onCancel={this.closeDetail}
        >
          {
            deployment &&  (
              <Row gutter={36}>
                <Col span={12}>
                  <Field label="User" value={deployment.userName ? deployment.userName : '-'} />
                  <Field label="Deployment Stopped" value={deployment.stop ? 'True' : 'False'} />
                  <Field label="Model Image" value={deployment.modelImage || '-'} />
                  <Field label="Replicas" value={deployment.replicas} />
                  <Field label="Group" value={deployment.groupName} />
                  <Field label="Instance Type" value={renderInstanceType(deployment.instanceType || {})} />
                  <Field label="Timestamp" value={renderTime(time)} />
                  <Field label="Description" value={(
                    <div style={{whiteSpace: 'pre-line'}}>
                      {deployment.description || '-'}
                    </div>
                  )} />
                  <Field label="Clients" value={deployment.endpointClients ? deployment.endpointClients.map(client => client.name).join(", ") : '-'} />
                </Col>
                <Col span={12}>
                  <Field type="vertical" label="Metadata" value={<Metadata metadata={deployment.metadata} />} />
                </Col>
              </Row>
            )
          }
        </Modal>
      </div>
    );
  }
}
