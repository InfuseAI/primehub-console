import React, { PureComponent } from 'react';
import { Icon, Table, Button } from 'antd';
import { remove } from 'lodash';
import difference from 'lodash/difference';
import { FormattedMessage } from 'react-intl';
import pluralize from 'pluralize';
import RelationPicker from './RelationPicker';

class RelationTable extends PureComponent {
  constructor(props) {
    super(props);
    this.isOnComposition = false;
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
    let { onChange, refId, value = [] } = this.props;
    // $FlowFixMe
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
    let {
      disabled,
      value = [],
      uiParams = {},
      relation,
      toolbar,
      Toolbar,
      relationValue,
      title,
      loading,
      relationRefetch,
      keyName,
    } = this.props;
    let { columns, pickerColumns } = uiParams;

    remove(columns, obj => {
      return obj && obj.visible === false;
    });

    remove(pickerColumns, obj => {
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
