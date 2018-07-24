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
    let { disabled, value, uiParams, refId, relation,
      fetch, fetchRelation, updateQuery, subscribe,
      schema, Toolbar, relationValue, goTo
    } = this.props;
    value = value && value.toJS ? value.toJS() : [];
    const newColumnsRender = renderValue(uiParams.columns, schema[relation.to].items.items);
    return (
      <div>
        <Table
          dataSource={value}
          columns={newColumnsRender}
        />
        <div>
          <a href="javascript:;" onClick={this.showModal}>
            <Icon type="link" style={{margin: '16px 8px'}}/>connect existed {relation.to}
          </a>
        </div>
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

function getTag(v, uiParams) {
  // use value and uiParams to generateTagName
  const {textCol, subtextCol, renderText} = uiParams;
  let tag = '';
  
  if (renderText) {
    // if there is renderText, textCol and subtextCol will be ignored;
    const compiler = template(renderText);
    try {
      tag = compiler(v);
    } catch (e) {
      throw e;
    }
  } else {
    const text = v[textCol];
    const subtext = v[subtextCol];
    tag = text + (subtext ? `(${subtext})` : '');
  }

  return tag;
}