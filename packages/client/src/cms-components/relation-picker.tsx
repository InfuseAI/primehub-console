import * as React from 'react';
import {Modal, Table} from 'antd';
import {isEqual, get, mapValues} from 'lodash';
import SyncToolbar from '@canner/antd-share-toolbar';
import styled from 'styled-components';

type Props = {
  title: string,
  onOk: Function,
  onCancel: Function,
  renderChildren: Function,
  visible: boolean,
  pickedIds: string[],
  pickOne?: boolean,
  refId: any,
  relation: {
    to: string,
    type: string,
  },
  updateQuery: Function,
  fetch: Function,
  relationValue: any,
  columns: Array<{
    title: string,
    key: string,
    datIndex: string
  }>,
  showPagination: boolean,
  subscribe: Function,
  rootValue: Object,
  Toolbar: React.ComponentType,
  toolbar: Record<string, any>,
  query: any,
  items: Object,
  keyName: string,
  request: Function,
  deploy: Function,
  relationArgs: Record<string, any>,
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

const StyledTable = styled(Table)`
`

export default class Picker extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      totalValue: [],
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
    let {totalValue} = this.state;

    const list = data.edges.map(edge => edge.node);
    list.forEach(item => {
      const index = totalValue.findIndex(v => v.id === item.id);
      if (index === -1) {
        totalValue.push(item);
      } else {
        totalValue[index] = item;
      }
    });
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
    const {relationArgs, updateRelationQuery, relation, toolbar} = this.props;
    const defaultArgs: any = {};
    console.log(sorter);
    if (!get(toolbar, 'async')) return;
    if (get(toolbar, 'pagination.number', false)) {
      defaultArgs.page = 1
    } else {
      defaultArgs.first = 10;
    }
    this.setState({ sorter });
    updateRelationQuery([relation.to], {
      ...relationArgs,
      orderBy:sorter.field ? {
        [sorter.field]: get(sorter, 'order') === 'ascend' ? 'asc' : 'desc'
      } : {}
    });
  }

  rowSelectOnChange = (selectedRowKeys: Array<string>) => {
    this.setState({
      selectedRowKeys
    });
  }

  render() {
    const { visible, columns, pickOne = false,
      Toolbar, toolbar, rootValue, refId,
      items, keyName, request, deploy, relationArgs
    } = this.props;
    const { selectedRowKeys, sorter } = this.state;
    const recordValue = get(rootValue, refId.remove().getPathArr());
    if (toolbar && toolbar.actions) {
      // not support export import in relation
      delete toolbar.actions.export;
      delete toolbar.actions.import;
    }
    console.log(relationArgs);
    return <Modal
      width={800}
      onOk={this.handleOk}
      onCancel={this.handleCancel}
      visible={visible}
    >
      <Toolbar>
        {
          dataSource => (
            <SyncToolbar
              dataSource={dataSource}
              toolbar={toolbar}
              recordValue={recordValue}
              selectedValue={[]}
              items={items}
              keyName={keyName}
              request={request}
              deploy={deploy}
            >
              {
                ({value, showPagination}) => (
                  <StyledTable
                    style={{marginBottom: 16}}
                    rowSelection={{
                      type: (pickOne) ? "radio" : "checkbox",
                      onChange: this.rowSelectOnChange,
                      selectedRowKeys: selectedRowKeys
                    }}
                    onChange={this.handleTableChange}
                    size="small"
                    columns={columns.map((column: Record<string, any>) => {
                      if (column.sorter && column.dataIndex === sorter.field) {
                        column.sortOrder = sorter.order;
                      } else {
                        column.sortOrder = false;
                      }
                      return column;
                    })}
                    // $FlowFixMe
                    dataSource={value.map(v => ({...v, key: v.id}))}
                    pagination={showPagination}
                  />
                )
              }
            </SyncToolbar>
          )
        }
      </Toolbar>
    </Modal>
  }
}