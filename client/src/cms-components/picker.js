import React, {PureComponent} from 'react';
import {Map, List, fromJS} from 'immutable';
import {Modal, Table, Button, Icon} from 'antd';
const ButtonGroup = Button.Group;
import styled from 'styled-components';

const ButtonWrapper = styled.div`
  text-align: right;
  margin-top: 16px;
`;

export default class Picker extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      totalValue: new List(),
      value: new List(),
      hasNextPage: false,
      hasPreviousPage: false,
      selectedRowKeys: props.pickedIds ? props.pickedIds : []
    };
  }
  
  componentWillReceiveProps(nextProps) {
    const {relationValue} = nextProps;
    this.updateData(relationValue);
  }

  componentDidMount() {
    const {relationValue} = this.props;
    this.updateData(relationValue);
  }

  updateData = (data) => {
    let {totalValue} = this.state;
    const {relation} = this.props;

    const list = data.getIn(['edges']).map(edge => edge.get('node'));
    list.forEach(item => {
      const index = totalValue.findIndex(v => v.get('id') === item.get('id'));
      if (index === -1) {
        totalValue = totalValue.push(item);
      } else {
        totalValue.set(index, item);
      }
    });
    this.setState({
      totalValue,
      value: list,
      hasNextPage: data.getIn(['pageInfo', 'hasNextPage']),
      hasPreviousPage: data.getIn(['pageInfo', 'hasPreviousPage'])
    });
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  handleOk = () => {
    this.props.onOk(fromJS(this.state.selectedRowKeys), this.state.totalValue);
  }

  rowSelectOnChange = (selectedRowKeys) => {
    this.setState({
      selectedRowKeys
    });
  }

  render() {
    const { visible, columns, pickOne = false, Toolbar } = this.props;
    const { value, selectedRowKeys, hasNextPage, hasPreviousPage } = this.state;
    return <Modal
      width={800}
      onOk={this.handleOk}
      onCancel={this.handleCancel}
      visible={visible}
    >
      <Toolbar>
        <Table
          style={{marginBottom: 16}}
          rowSelection={{
            type: (pickOne) ? "radio" : "checkbox",
            onChange: this.rowSelectOnChange,
            selectedRowKeys: selectedRowKeys
          }}
          size="middle"
          columns={columns}
          // $FlowFixMe
          dataSource={value.toJS().map(v => ({key: v.id, ...v}))}
          pagination={false}
        />
      </Toolbar>
    </Modal>
  }
}