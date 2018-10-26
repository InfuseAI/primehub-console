import React, { Component } from "react";
import { Table, Button, Modal, Icon } from "antd";
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from "react-intl";
import defaultMessage, {renderValue} from "@canner/antd-locales";
import EmailForm from './customize-object-email_form';

const ButtonGroup = Button.Group;
const confirm = Modal.confirm;

@injectIntl
export default class ArrayBreadcrumb extends Component {
  static defaultProps = {
    value: [],
    showPagination: true,
    schema: {}
  };

  static contextTypes = {
    fetch: PropTypes.func
  }

  state = {
    emailFormVisible: false,
    selectedRowKeys: []
  }

  onSelectChange = (selectedRowKeys) => {
    this.setState({selectedRowKeys});
  }

  add = () => {
    const {goTo, refId} = this.props;
    goTo({pathname: refId.toString(), operator: 'create'});
  }

  edit = (recordId) => {
    const {goTo, refId} = this.props;
    goTo({pathname: `${refId.toString()}/${recordId}`});
  }

  remove = (index) => {
    const {onChange, deploy, refId, value, intl} = this.props;
    confirm({
      title: intl.formatMessage({ id: "array.table.delete.confirm" }),
      okType: 'danger',
      onOk() {
        onChange(refId.child(index), 'delete').then(() => {
          deploy(refId.getPathArr()[0], value[index].id);
        });
      }
    });
    
  }

  openModal = () => {
    this.setState({
      emailFormVisible: true
    });
  }

  closeModal = () => {
    this.setState({
      emailFormVisible: false
    });
  }

  render() {
    const {
      uiParams,
      value,
      showPagination,
      items,
      intl,
      keyName
    } = this.props;

    const {
      selectedRowKeys,
      emailFormVisible
    } = this.state;

    const addText = (
      <FormattedMessage
        id="array.table.addText"
        defaultMessage={defaultMessage.en["array.table.addText"]}
      />
    );
    const sendEmailText = (
      <FormattedMessage
        id="array.table.sendEmailText"
        defaultMessage="Send Email"
      />
    );

    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };
  
    let {
      createKeys,
      columns = []
    } = uiParams;

    const newColumnsRender = renderValue(columns, items.items);

    newColumnsRender.push({
      title: intl.formatMessage({ id: "array.table.actions" }),
      dataIndex: "__settings",
      key: "__settings",
      render: (text, record) => {
        return (
          <ButtonGroup>
            <Button icon="edit"
              onClick={() => this.edit(record.id)}
            />
            <Button icon="delete"
              onClick={() => this.remove(record.__index)}
            />
          </ButtonGroup>
        );
      }
    });

    return (
      <div>
        <ButtonGroup
          style={{
            marginBottom: '16px',
            display: 'block',
            textAlign: 'right'
          }}
        >
          {
            keyName === "user" && (
              <Button
                onClick={this.openModal}
              >
                <Icon
                  type="mail"
                  theme="outlined"
                  style={{
                    position: 'relative',
                    top: 1
                  }}
                />
                {sendEmailText}
              </Button>
            )
          }
          {(!createKeys || createKeys.length > 0) && (
            <Button
              onClick={this.add}
            >
              <Icon
                type="plus"
                theme="outlined"
                style={{
                  position: 'relative',
                  top: 1
                }}
              />
              {addText}
            </Button>
          )}
        </ButtonGroup>
        <Table
          pagination={showPagination}
          dataSource={value.map((datum, i) => {
            return {...datum, __index: i, key: datum.key || i};
          })}
          columns={newColumnsRender}
          style={{marginBottom: 32}}
          rowKey="id"
          rowSelection={rowSelection}
        />
        <Modal
          closable
          footer={null}
          onCancel={this.closeModal}
          visible={emailFormVisible}
          width={600}
        >
          <EmailForm
          />
        </Modal>
      </div>
    );
  }
}