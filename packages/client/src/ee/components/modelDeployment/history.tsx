import React from 'react';
import {Icon, Table, Modal, Row, Col, Tooltip} from 'antd';
import {renderTime, renderInstanceType} from 'ee/components/modelDeployment/detail';
import Field from 'components/share/field';
import {HistoryItem} from 'ee/components/modelDeployment/common';
import Metadata from 'ee/components/modelDeployment/metadata';
import EnvList from 'components/share/envList';
import moment from 'moment';
import styled from 'styled-components';

type Props = {
  history: Array<HistoryItem>;
}

type State = {
  historyItem: HistoryItem;
  visible: boolean;
  revealEnv: boolean;
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
    revealEnv: false
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

  toggleEnvVisibilty = () => {
    const revealEnv = !this.state.revealEnv;
    this.setState({revealEnv});
  }


  render() {
    const {history} = this.props;
    const {visible, historyItem, revealEnv} = this.state;
    const {deployment = {}, time} = historyItem || {};
    const revealBtn = (
      <span onClick={this.toggleEnvVisibilty} style={{cursor: 'pointer', verticalAlign: '-0.05em'}}>
      { revealEnv ? <Icon type="eye" title='Hide value' /> : <Icon type="eye-invisible" title="Show value" /> }
      </span>
    )
    const columns = [{
      title: 'Update Message',
      dataIndex: 'deployment',
      key: 'updateMessage',
      width: 300,
      // ellipsis: true,
      render: deployment => (
        <Tooltip placement="topLeft" style={{...textOverflowStyle}} title={deployment.updateMessage}>
          <div className="cell">
            <div className="cell-overflow">
              {deployment.updateMessage || '-'}
            </div>
          </div>
        </Tooltip>
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
                  <Field label="Model URI" value={deployment.modelURI || '-'} />
                  <Field label="Replicas" value={deployment.replicas} />
                  <Field label="Group" value={deployment.groupName} />
                  <Field label="Instance Type" value={renderInstanceType(deployment.instanceType || {})} />
                  <Field label="Timestamp" value={renderTime(time)} />
                  <Field label="Description" value={(
                    <div style={{whiteSpace: 'pre-line'}}>
                      {deployment.description || '-'}
                    </div>
                  )} />
                  <Field label="Access Type" value={deployment.endpointAccessType ? deployment.endpointAccessType : 'public'} />
                  <Field label="Clients" value={deployment.endpointClients ? deployment.endpointClients.map(client => client.name).join(", ") : '-'} />
                </Col>
                <Col span={12}>
                  <Field type="vertical" label="Metadata" value={<Metadata metadata={deployment.metadata} />} />
                  <Field type="vertical" label={<span>Environment Variables {revealBtn}</span>} value={<EnvList envList={deployment.env} valueVisibility={revealEnv} />} />
                </Col>
              </Row>
            )
          }
        </Modal>
      </div>
    );
  }
}
