import * as React from 'react';
import styled from 'styled-components';
import { Input, Modal, Table, Icon, Button, Row, Col } from 'antd';
import { isEqual, get, keys } from 'lodash';

interface WrapperProps {
  marginTop?: number;
  marginRight?: number;
}

const Wrapper = styled.div<WrapperProps>`
  text-align: right;
  margin-top: ${props => props.marginTop}px;
  margin-right: ${props => props.marginRight}px;
  display: inline-block;
`;

const { Search } = Input;

export const FilterRow = styled(Row)`
  width: 100%;
  border: 1px #f8f8f8 solid;
  padding: 15px;
  box-shadow: 1px 1px 4px #eee;
`;

interface Props {
  searchPlaceholder: string;
  title: string;
  onOk: (selectedRowKeys: any[], totalValue: any[]) => void;
  onCancel: () => void;
  visible: boolean;
  pickedIds: string[];
  relation: {
    to: string;
    type: string;
  };
  relationValue: any;
  columns: Array<{
    title: string;
    key: string;
    datIndex: string;
  }>;
  updateRelationQuery: (query: any) => void;
  loading?: boolean;
  pickOne?: boolean;
  showPagination?: boolean;
  prevPage?: () => void;
  nextPage?: () => void;
}

interface State {
  totalValue: any[];
  selectedRowKeys: string[];
  sorter: {
    field?: string;
    order?: 'ascend' | 'descend';
  };
}

const SwitchPagination = props => {
  const { enable, hasPreviousPage, hasNextPage, prevPage, nextPage } = props;
  if (enable) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Wrapper marginTop={16}>
          <Button.Group>
            <Button
              disabled={!hasPreviousPage}
              onClick={prevPage}
              data-testid='pagination-previous-button'
            >
              <Icon type='left' />
              Previous
            </Button>
            <Button
              disabled={!hasNextPage}
              onClick={nextPage}
              data-testid='pagination-next-button'
            >
              Next
              <Icon type='right' />
            </Button>
          </Button.Group>
        </Wrapper>
      </div>
    );
  } else {
    return <></>;
  }
};

export default class Picker extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const list = props.relationValue?.edges?.map(edge => edge.node);
    this.state = {
      totalValue: list || [],
      selectedRowKeys: props.pickedIds || [],
      sorter: {},
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const { relationValue, pickedIds } = nextProps;
    if (!isEqual(pickedIds, this.props.pickedIds)) {
      this.setState({
        selectedRowKeys: pickedIds || [],
      });
    }
    this.updateData(relationValue);
  }

  componentDidMount() {
    const { relationValue } = this.props;
    this.updateData(relationValue);
  }

  updateData = (data: any) => {
    const totalValue = data?.edges.map(edge => edge.node) || [];
    this.setState({
      totalValue,
    });
  };

  handleCancel = () => {
    this.props.onCancel();
  };

  handleOk = () => {
    this.props.onOk(this.state.selectedRowKeys, this.state.totalValue);
  };

  handleSearch = value => {
    const { updateRelationQuery } = this.props;
    const { sorter } = this.state;
    updateRelationQuery({
      where: {
        name_contains: value,
      },
      orderBy: sorter.field
        ? {
            [sorter.field]: get(sorter, 'order') === 'ascend' ? 'asc' : 'desc',
          }
        : {},
    });
  };

  handleTableChange = (pagination, filters, sorter) => {
    const { updateRelationQuery } = this.props;
    if (!isEqual(this.state.sorter, sorter)) {
      this.setState({ sorter });
      updateRelationQuery({
        orderBy: sorter.field
          ? {
              [sorter.field]:
                get(sorter, 'order') === 'ascend' ? 'asc' : 'desc',
            }
          : {},
      });
    }
  };

  rowSelectOnChange = (selectedRowKeys: string[]) => {
    this.setState({
      selectedRowKeys,
    });
  };

  render() {
    const {
      visible,
      columns,
      pickOne = false,
      loading,
      title,
      searchPlaceholder = '',
      relationValue = {},
      prevPage = () => undefined,
      nextPage = () => undefined,
    } = this.props;

    const { pageInfo = {} } = relationValue;
    const pageInfoKeys = keys(pageInfo);
    const { hasNextPage, hasPreviousPage } = pageInfo;
    const switchPagination = pageInfoKeys.includes('hasNextPage');
    const { selectedRowKeys, totalValue, sorter } = this.state;
    return (
      <Modal
        width={800}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        visible={visible}
        title={title}
      >
        <FilterRow style={{ marginBottom: 12 }}>
          <Col span={12}>
            <Search
              data-testid='text-filter'
              placeholder={searchPlaceholder}
              onSearch={this.handleSearch}
              enterButton
            />
          </Col>
        </FilterRow>
        <Table
          size={'small'}
          pagination={switchPagination ? false : { size: 'default' }}
          loading={loading}
          rowSelection={{
            type: pickOne ? 'radio' : 'checkbox',
            onChange: this.rowSelectOnChange,
            selectedRowKeys,
          }}
          onChange={this.handleTableChange}
          columns={columns.map((column: Record<string, any>) => {
            column.sortOrder =
              column.sorter && column.dataIndex === sorter.field
                ? sorter.order || 'ascend'
                : false;
            return column;
          })}
          dataSource={totalValue.map(v => ({ ...v, key: v.id }))}
        />
        <SwitchPagination
          enable={switchPagination}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          prevPage={prevPage}
          nextPage={nextPage}
        />
      </Modal>
    );
  }
}
