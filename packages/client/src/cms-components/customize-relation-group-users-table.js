import React, { PureComponent } from "react";
import { Tag, Tooltip, Icon, Table, Button, Checkbox } from "antd";
import template from 'lodash/template';
import { remove } from 'lodash';
import difference from "lodash/difference";
import get from 'lodash/get';
import Picker from './relation-picker';
import {injectIntl} from 'react-intl';
import {FormattedMessage} from "react-intl";
import {renderValue} from '@canner/antd-locales';
import pluralize from 'pluralize';

@injectIntl
export default class RelationGroupUsersTable extends PureComponent {
  constructor(props) {
    super(props);
    this.isOnComposition = false;
    this.state = {
      modalVisible: false,
      admins: []
    };
  }

  componentDidMount () {
    const { rootValue } = this.props;
    const org_admins = get(rootValue, ['group', '0', 'admins'], "");
    const admins = org_admins ? org_admins.split(',') : [];
    this.setState({admins});
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
    const {updateRelationQuery, relationArgs, relation, toolbar} = this.props;
    this.setState({
      modalVisible: false
    });
    const defaultQuery = {where: {}};
    if (get(toolbar, 'async') && get(toolbar, 'pagination.number')) {
      defaultQuery.page = 1;
    } else {
      defaultQuery.first = 10;
    }
    updateRelationQuery([relation.to], defaultQuery)
  }

  handleClose = (index) => {
    const {onChange, refId, value} = this.props;
    onChange(refId, 'disconnect', value[index]);
  }

  onGroupAdminChange = (checked, value) => {
    let {onChange, refId} = this.props;
    const parentRefId = refId.remove(1);
    if (checked) {
      this.addAdmin(value);
    } else {
      this.removeAdmin(value);
    }
    console.log(this.state.admins);
    onChange(parentRefId.child('admins'), 'update', this.state.admins.toString(), {});
  }

  removeAdmin = (value) => {
    const { admins } = this.state;
    const index = admins.indexOf(value);
    if (index !== -1) {
      admins.splice(index, 1);
    }
    this.setState({admins});
  };

  addAdmin = (value) => {
    const { admins } = this.state;
    const index = admins.indexOf(value);
    if (index === -1) {
      admins.push(value);
    }
    this.setState({admins});
  }

  renderGroupAdminCheckbox = (value, record) => {
    const { admins } = this.state;
    return <Checkbox checked={admins.includes(record.username)}
      onChange={(e) => { this.onGroupAdminChange(e.target.checked, record.username); }} />;
  }

  render() {
    const TYPE_GROUPS = 'groups';
    const { modalVisible } = this.state;
    let showValues = [];
    let { disabled, value = [], uiParams = {}, refId, relation,
      fetch, fetchRelation, updateQuery, subscribe, intl, toolbar,
      schema, Toolbar, relationValue, goTo, rootValue, title, isRelationFetching,
      relationArgs, updateRelationQuery, keyName,
    } = this.props;
    let { columns, pickerColumns } = uiParams;

    remove(columns, (obj) => {
      return obj && obj.visible === false;
    });

    remove(pickerColumns, (obj) => {
      return obj && obj.visible === false;
    });

    // Hide everyone group in group relationship.
    if (keyName === TYPE_GROUPS) {
      const everyoneGroupId = window.everyoneGroupId;
      showValues = value.filter( v => v.id !== everyoneGroupId );
    } else {
      showValues = value;
    }

    const columnsRender = renderValue(columns, schema[relation.to].items.items, this.props);
    const pickerColumnsRender = renderValue(pickerColumns || uiParams.columns, schema[relation.to].items.items, this.props);
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
          dataSource={showValues}
          columns={[...columnsRender, {title: intl.formatMessage({id: 'group.admin'}), render: this.renderGroupAdminCheckbox}]}
          style={{marginBottom: 16}}
        />
        {
          (!disabled && modalVisible) && <Picker
            visible={modalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            // $FlowFixMe
            pickedIds={value.map(v => v.id)}
            columns={pickerColumnsRender}
            refId={refId}
            relation={relation}
            relationValue={relationValue}
            fetch={fetch}
            subscribe={subscribe}
            updateQuery={updateQuery}
            fetchRelation={fetchRelation}
            Toolbar={Toolbar}
            relationArgs={relationArgs}
            toolbar={toolbar}
            updateRelationQuery={updateRelationQuery}
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
