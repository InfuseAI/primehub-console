import React, { PureComponent } from "react";
import { Tag, Tooltip, Icon, Table } from "antd";
import template from 'lodash/template';
import difference from "lodash/difference";
import Picker from './picker';
import {renderValue} from '@canner/antd-locales';

export default class RelationTable extends PureComponent {
  constructor(props) {
    super(props);
    this.isOnComposition = false;
    this.state = {
      modalVisible: false
    };
  }

  static defaultProps = {
    uiParams: {}
  }

  showModal = () => {
    this.setState({
      modalVisible: true
    });
  }

  handleOk = (queue, originData) => {
    let {onChange, refId, value} = this.props;
    value = value && value.toJS ? value.toJS() : [];
    queue = queue.toJS();
    // $FlowFixMe
    const currentIds = value.map(v => v.id);

    const idsShouldCreate = difference(queue, currentIds);
    const idsShouldRemove = difference(currentIds, queue);
    const createActions = idsShouldCreate.map(id => ({refId, type: "connect", value: originData.find(data => data.get('id') === id)}));
    const delActions = idsShouldRemove.map(id => ({refId, type: "disconnect", value: originData.find(data => data.get('id') === id)}));
    onChange([...createActions, ...delActions]);
    this.handleCancel();
  }

  handleCancel = () => {
    this.setState({
      modalVisible: false
    });
  }

  handleClose = (index) => {
    const {onChange, refId, value} = this.props;
    onChange(refId, 'disconnect', value.get(index));
  }

  render() {
    const { modalVisible } = this.state;
    let { disabled, value, uiParams = {}, refId, relation,
      fetch, fetchRelation, updateQuery, subscribe,
      schema, Toolbar, relationValue, goTo, rootValue, title
    } = this.props;
    value = value && value.toJS ? value.toJS() : [];
    const newColumnsRender = renderValue(uiParams.columns, schema[relation.to].items.items);
    const recordValue = getRecordValue(rootValue, refId);
    // hack
    const isHidden = uiParams.isHidden ? uiParams.isHidden(recordValue.toJS()) : false;
    if (isHidden) {
      return null;
    }
    return (
      <div>
        <div style={{marginTop: 16, fontSize: 18}}>{title}</div>
        <Table
          dataSource={value}
          columns={newColumnsRender}
        />
        {
          !disabled && <div>
            <a href="javascript:;" onClick={this.showModal}>
              <Icon type="link" style={{margin: '16px 8px'}}/>connect existed {relation.to}
            </a>
          </div>
        }
        {
          !disabled && <Picker
            title="選擇你要的物件"
            visible={modalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            // $FlowFixMe
            pickedIds={value.map(v => v.id)}
            columns={uiParams.columns}
            refId={refId}
            relation={relation}
            relationValue={relationValue}
            fetch={fetch}
            subscribe={subscribe}
            updateQuery={updateQuery}
            fetchRelation={fetchRelation}
            Toolbar={Toolbar}
          />
        }
      </div>
    );
  }
}

function getRecordValue(rootValue, refId) {
  const targetRefId = refId.remove();
  return rootValue.getIn(targetRefId.getPathArr());
}