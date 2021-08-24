import React, { PureComponent } from 'react';
import { Icon, Table, Button } from 'antd';
import { remove, difference } from 'lodash';
import { FormattedMessage } from 'react-intl';
import pluralize from 'pluralize';
import RelationPicker from './RelationPicker';

interface Props {
  disabled: boolean;
  onChange: (actions: any[]) => void;
  value: any[];
  uiParams: any;
  relation: any;
  relationValue: any;
  loading: boolean;
  title: string;
  relationRefetch: () => void;
  searchPlaceholder: string;
}

interface State {
  modalVisible: boolean;
}

class RelationTable extends PureComponent<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
    };
  }

  static defaultProps = {
    uiParams: {},
  };

  showModal = () => {
    this.setState({
      modalVisible: true,
    });
  };

  handleOk = (queue, originData) => {
    const { onChange, value = [] } = this.props;
    const currentIds = value.map(v => v.id);
    const idsShouldCreate = difference(queue, currentIds);
    const idsShouldRemove = difference(currentIds, queue);
    const createActions = idsShouldCreate.map(id => ({
      type: 'connect',
      value: originData.find(data => data.id === id),
    }));
    const delActions = idsShouldRemove.map(id => ({
      type: 'disconnect',
      value: originData.find(data => data.id === id),
    }));
    onChange([...createActions, ...delActions]);
    this.handleCancel();
  };

  handleCancel = () => {
    this.setState({
      modalVisible: false,
    });
  };

  render() {
    const TYPE_GROUPS = 'group';
    const { modalVisible } = this.state;
    let showValues = [];
    const {
      disabled,
      value = [],
      uiParams = {},
      relation,
      relationValue,
      title,
      loading,
      relationRefetch,
      searchPlaceholder,
    } = this.props;
    const { columns, pickerColumns } = uiParams;

    remove(columns, (obj: { visible: boolean }) => {
      return obj && obj.visible === false;
    });

    remove(pickerColumns, (obj: { visible: boolean }) => {
      return obj && obj.visible === false;
    });

    // Hide everyone group in group relationship.
    if (relation.to === TYPE_GROUPS) {
      const everyoneGroupId = window.everyoneGroupId;
      showValues = value.filter(v => v.id !== everyoneGroupId);
    } else {
      showValues = value;
    }

    return (
      <div>
        {uiParams.isHidden && (
          <div style={{ marginTop: 16, fontSize: 18 }}>{title}</div>
        )}
        {!disabled && (
          <div>
            <Button
              data-testid='connect-button'
              onClick={this.showModal}
              style={{ margin: '16px 8px 16px 0' }}
            >
              <Icon type='link' />
              <FormattedMessage
                id='relation.multipleSelect.connect'
                defaultMessage='edit '
              />
              <span style={{ marginLeft: 4, textTransform: 'capitalize' }}>
                {pluralize.plural(relation.to)}
              </span>
            </Button>
          </div>
        )}
        <Table
          dataSource={showValues}
          columns={columns}
          style={{ marginBottom: 16 }}
        />
        {!disabled && modalVisible && (
          <RelationPicker
            searchPlaceholder={searchPlaceholder}
            visible={modalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            // $FlowFixMe
            pickedIds={value.map(v => v.id)}
            columns={pickerColumns}
            relation={relation}
            relationValue={relationValue}
            title={title}
            updateRelationQuery={relationRefetch}
            loading={loading}
          />
        )}
      </div>
    );
  }
}

export default RelationTable;
