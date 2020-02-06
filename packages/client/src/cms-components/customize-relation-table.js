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

@injectIntl
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
    let {onChange, refId, value = []} = this.props;
    // $FlowFixMe
    const currentIds = value.map(v => v.id);
    const idsShouldCreate = difference(queue, currentIds);
    const idsShouldRemove = difference(currentIds, queue);
    const createActions = idsShouldCreate.map(id => ({refId, type: "connect", value: originData.find(data => data.id === id)}));
    const delActions = idsShouldRemove.map(id => ({refId, type: "disconnect", value: originData.find(data => data.id === id)}));
    onChange([...createActions, ...delActions]);
    this.handleCancel();
  }

  handleCancel = () => {
    const {updateRelationQuery, relationArgs, relation} = this.props;
    this.setState({
      modalVisible: false
    });
    updateRelationQuery([relation.to], {
      where: {},
      after: undefined,
      before: undefined,
      first: 10,
      last: undefined,
      orderBy: undefined,
    })
  }

  handleClose = (index) => {
    const {onChange, refId, value} = this.props;
    onChange(refId, 'disconnect', value[index]);
  }

  render() {
    const { modalVisible } = this.state;
    let { disabled, value = [], uiParams = {}, refId, relation,
      fetch, fetchRelation, updateQuery, subscribe, intl,
      schema, Toolbar, relationValue, goTo, rootValue, title, isRelationFetching
    } = this.props;
    const newColumnsRender = renderValue(uiParams.columns, schema[relation.to].items.items);
    const recordValue = getRecordValue(rootValue, refId);
    // hack
    const isHidden = uiParams.isHidden ? uiParams.isHidden(recordValue) : false;
    if (isHidden) {
      return null;
    }
    return (
      <div>
        {
          uiParams.isHidden && <div style={{marginTop: 16, fontSize: 18}}>{title}</div>
        }
        {
          !disabled && <div>
            <Button data-testid="connect-button" onClick={this.showModal} style={{margin: '16px 8px 16px 0'}}>
              <Icon type="link"/>
              <FormattedMessage
                id="relation.multipleSelect.connect"
                defaultMessage="edit "
              />
              <span style={{marginLeft: 4}}>
                {pluralize.plural(schema[relation.to].keyName)}
              </span>
            </Button>
          </div>
        }
        <Table
          dataSource={value}
          columns={newColumnsRender}
          style={{marginBottom: 16}}
        />
        {
          (!disabled && modalVisible) && <Picker
            visible={modalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            // $FlowFixMe
            pickedIds={value.map(v => v.id)}
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
      </div>
    );
  }
}

function getRecordValue(rootValue, refId) {
  const targetRefId = refId.remove();
  return get(rootValue, targetRefId.getPathArr(), {});
}
