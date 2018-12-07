import React, { PureComponent } from "react";
import { Tag, Tooltip, Icon, Table, Button } from "antd";
import template from 'lodash/template';
import difference from "lodash/difference";
import get from 'lodash/get';
import Picker from '@canner/antd-share-relation';
import {injectIntl} from 'react-intl';
import {FormattedMessage} from "react-intl";
import {renderValue} from '@canner/antd-locales';
import pluralize from 'pluralize';
import styled from 'styled-components';

const Title = styled.div`
  color: rgba(0, 0, 0, 0.85);
  padding: 0px 0px 8px;
`;

@injectIntl
export default class DatesetGroupTable extends PureComponent {
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

  showModal = ({writable}) => {
    this.setState({
      modalVisible: true,
      writable
    });
  }

  handleOk = (queue, originData) => {
    let {onChange, refId, value = [], relati} = this.props;
    const {writable} = this.state;
    // $FlowFixMe
    const readOnlyValue = value.filter(item => !item.writable);
    const writableValue = value.filter(item => item.writable);
    const currentIds = writable ?
      value.filter(item => item.writable).map(v => v.id) :
      value.filter(item => !item.writable).map(v => v.id);
    const idsShouldCreate = difference(queue, currentIds);
    const idsShouldRemove = difference(currentIds, queue);
    const createActions = idsShouldCreate.map(id => ({refId, type: "connect", value: originData.find(data => data.id === id)}));
    const delActions = idsShouldRemove.map(id => ({refId, type: "disconnect", value: originData.find(data => data.id === id)}));
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
    onChange(refId, 'disconnect', value[index]);
  }

  render() {
    const { modalVisible } = this.state;
    let { disabled, value = [], uiParams = {}, refId, relation,
      fetch, fetchRelation, updateQuery, subscribe, intl,
      schema, Toolbar, relationValue, goTo, rootValue, title
    } = this.props;
    const newColumnsRender = renderValue(uiParams.columns, schema[relation.to].items.items);
    const recordValue = getRecordValue(rootValue, refId);
    // hack
    const isHidden = uiParams.isHidden ? uiParams.isHidden(recordValue) : false;
    if (isHidden) {
      return null;
    }
    const {readOnly, writable} = getDisplayTableType(recordValue);
    const readOnlyValue = value.filter(item => !item.writable);
    const writableValue = value.filter(item => item.writable);
    console.log(readOnlyValue, writableValue);
    return (
      <div>
        {
          uiParams.isHidden && <div style={{marginTop: 16, fontSize: 18}}>{title}</div>
        }
        
        {
          readOnly && (
            <>
              <Title>
                <FormattedMessage
                  id="readOnlyGroups"
                  defaultMessage="Readonly Groups"
                />
              </Title>
              {
                !disabled && <div>
                  <Button onClick={() => this.showModal({writable: false})} style={{margin: '16px 8px 16px 0'}}>
                    <Icon type="link"/>
                    <FormattedMessage
                      id="relation.multipleSelect.connect"
                      defaultMessage="connect existing "
                    />
                    {pluralize.plural(schema[relation.to].keyName)}
                  </Button>
                </div>
              }
              <Table
                dataSource={readOnlyValue}
                columns={newColumnsRender}
                size="small"
                style={{marginBottom: 16}}
              />
              {
                !disabled && <Picker
                  visible={!this.state.writable && modalVisible}
                  onOk={this.handleOk}
                  onCancel={this.handleCancel}
                  // $FlowFixMe
                  pickedIds={readOnlyValue.map(v => v.id)}
                  columns={newColumnsRender}
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
            </>
          )
        }
        {
          writable && (
            <>
              <Title>
                <FormattedMessage
                  id="writableGroups"
                  defaultMessage="Writable Groups"
                />
              </Title>
              {
                !disabled && <div>
                  <Button onClick={() => this.showModal({writable: true})} style={{margin: '16px 8px 16px 0'}}>
                    <Icon type="link"/>
                    <FormattedMessage
                      id="relation.multipleSelect.connect"
                      defaultMessage="connect existing "
                    />
                    {pluralize.plural(schema[relation.to].keyName)}
                  </Button>
                </div>
              }
              <Table
                dataSource={writableValue}
                columns={newColumnsRender}
                style={{marginBottom: 16}}
                size="small"
              />
              {
                !disabled && <Picker
                  visible={this.state.writable && modalVisible}
                  onOk={this.handleOk}
                  onCancel={this.handleCancel}
                  // $FlowFixMe
                  pickedIds={writableValue.map(v => v.id)}
                  columns={newColumnsRender}
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
            </>
          )
        }
      </div>
    );
  }
}

function getRecordValue(rootValue, refId) {
  const targetRefId = refId.remove();
  return get(rootValue, targetRefId.getPathArr(), {});
}

function getDisplayTableType(recordValue) {
  if (recordValue.global && recordValue.type !== 'pv') {
    return {
      readOnly: false,
      writable: false
    };
  }
  if (!recordValue.global && recordValue.type !== 'pv') {
    return {
      readOnly: true,
      writable: false
    };
  }
  if (!recordValue.global && recordValue.type === 'pv') {
    return {
      readOnly: true,
      writable: true
    };
  }
  if (recordValue.global && recordValue.type === 'pv') {
    return {
      readOnly: false,
      writable: true
    }
  }
}