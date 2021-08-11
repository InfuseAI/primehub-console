import * as React from 'react';
import {Modal, Table} from 'antd';
import {isEqual, get, mapValues} from 'lodash';

type Props = {
  title: string,
  onOk: Function,
  onCancel: Function,
  renderChildren: Function,
  visible: boolean,
  pickedIds: string[],
  pickOne?: boolean,
  relation: {
    to: string,
    type: string,
  },
  relationValue: any,
  columns: Array<{
    title: string,
    key: string,
    datIndex: string
  }>,
  showPagination: boolean,
  rootValue: Object,
  Toolbar: React.ComponentType,
  toolbar: Record<string, any>,
  query: any,
  items: Object,
  keyName: string,
  request: Function,
  deploy: Function,
  updateRelationQuery: Function,
};

type State = {
  totalValue: Array<any>,
  selectedRowKeys: Array<string>,
  sorter: {
    field?: string,
    order?: 'ascend' | 'descend'
  }
};

export default class Picker extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const list = props.relationValue.edges.map(edge => edge.node);
    this.state = {
      totalValue: list || [],
      selectedRowKeys: props.pickedIds || [],
      sorter: {},
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    const {relationValue, pickedIds} = nextProps;
    if (!isEqual(pickedIds, this.props.pickedIds)) {
      this.setState({
        selectedRowKeys: pickedIds || []
      });
    }
    this.updateData(relationValue);
  }

  componentDidMount() {
    const {relationValue} = this.props;
    this.updateData(relationValue);
  }

  updateData = (data: any) => {
    const totalValue = data.edges.map(edge => edge.node);
    this.setState({
      totalValue
    });
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  handleOk = () => {
    this.props.onOk(this.state.selectedRowKeys, this.state.totalValue);
  }

  handleTableChange = (pagination, filters, sorter) => {
    const {updateRelationQuery, relation, toolbar} = this.props;
    const defaultArgs: any = {};
    if (get(toolbar, 'pagination.number', false)) {
      defaultArgs.page = 1
    } else {
      defaultArgs.first = 10;
    }
    if (!isEqual(this.state.sorter, sorter)) {
      this.setState({ sorter });
      updateRelationQuery({
        orderBy:sorter.field ? {
          [sorter.field]: get(sorter, 'order') === 'ascend' ? 'asc' : 'desc'
        } : {}
      });
    }
  }

  rowSelectOnChange = (selectedRowKeys: Array<string>) => {
    this.setState({
      selectedRowKeys
    });
  }

  render() {
    const { visible, columns, pickOne = false,
      Toolbar, toolbar, rootValue,
      items, keyName, request, deploy, loading
    } = this.props;
    const { selectedRowKeys, totalValue, sorter } = this.state;
    if (toolbar && toolbar.actions) {
      // not support export import in relation
      delete toolbar.actions.export;
      delete toolbar.actions.import;
    }
    return <Modal
      width={800}
      onOk={this.handleOk}
      onCancel={this.handleCancel}
      visible={visible}
    >
      <Table
        style={{marginBottom: 16}}
        loading={loading}
        rowSelection={{
          type: (pickOne) ? "radio" : "checkbox",
          onChange: this.rowSelectOnChange,
          selectedRowKeys: selectedRowKeys
        }}
        onChange={this.handleTableChange}
        columns={columns.map((column: Record<string, any>) => {
          if (column.sorter && column.dataIndex === sorter.field) {
            column.sortOrder = sorter.order || 'ascend';
          } else {
            column.sortOrder = false;
          }
          return column;
        })}
        // $FlowFixMe
        dataSource={totalValue.map(v => ({...v, key: v.id}))}
      />
    </Modal>
  }
}
