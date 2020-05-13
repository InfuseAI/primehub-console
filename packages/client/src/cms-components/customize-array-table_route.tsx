import React, { Component } from "react";
import {get} from 'lodash';
import { Table, Button, Modal, Icon, notification } from "antd";
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from "react-intl";
import defaultMessage, {renderValue} from "@canner/antd-locales";
import EmailForm from '../cms-toolbar/sendEmailModal';
import {renderUploadServerLink} from '../../schema/utils';
import {Props} from './types';
import styled from 'styled-components';

const ButtonGroup = Button.Group;
const confirm = Modal.confirm;
const GLOBAL_DISABLE = (window as any).disableMode || false;
const DISABLE_GROUP = (window as any).disableGroup || false;
const StyledTable = styled(Table)`
  th svg {
    display: none;
  }
`

@injectIntl
export default class ArrayBreadcrumb extends Component<Props & {
  registerSendEmailCallback: (callback: Function) => void;
  changeOrderBy: (orderBy: Record<string, string>) => void;
}> {
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

  componentDidMount() {
    const {registerSendEmailCallback, keyName} = this.props;
    if (keyName === 'user' && registerSendEmailCallback)
      registerSendEmailCallback(this.openModal);
  }

  handleTableChange = (pagination, filters, sorter) => {
    const {changeOrderBy} = this.props;
    changeOrderBy({
      [sorter.field]: get(sorter, 'order[0]') === 'ascend' ? 'asc' : 'desc'
    });
  }

  onSelectChange = (record, selected) => {
    let {selectedRowKeys} = this.state;
    if (selected) {
      selectedRowKeys.push(record.id);
    } else {
      selectedRowKeys = selectedRowKeys.filter(id => id !== record.id);
    }
    this.setState({selectedRowKeys});
  }

  onSelectAll = (selected, selectedRows, changeRows) => {
    let {selectedRowKeys} = this.state;
    const changeKeys = changeRows.map(row => row.id);
    if (selected) {
      changeKeys.forEach(id => {
        selectedRowKeys.push(id);
      });
    } else {
      selectedRowKeys = selectedRowKeys.filter(id => changeKeys.indexOf(id) === -1);
    }
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
    const {onChange, deploy, refId, value, intl, keyName} = this.props;
    let recordId = value[index].id;
    let actualIndex = index;
    if (keyName === 'workspace') {
      const dataSource = value.filter(dataSource => !dataSource.isDefault);
      recordId = dataSource[index].id;
      actualIndex = value.findIndex(record => record.id === recordId);
    }
    confirm({
      title: intl.formatMessage({ id: "array.table.delete.confirm" }),
      okType: 'danger',
      onOk() {
        onChange(refId.child(actualIndex), 'delete').then(() => {
          deploy(refId.getPathArr()[0], recordId);
        });
      }
    });
    
  }

  send = (index) => {
    const {onChange, refId, deploy} = this.props;
    onChange(refId.child(index).child('status'), 'update', 'published')
      .then(() => {
        deploy(refId.getPathArr()[0]);
      });
  }

  openModal = () => {
    const {selectedRowKeys} = this.state;
    if (selectedRowKeys.length < 1) {
      notification.info({
        message: 'No Selected Users',
        description: 'Please select one or more users to send emails.',
        placement: 'bottomRight'
      })
    } else {
      this.setState({
        emailFormVisible: true
      });
    }
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
      keyName,
      goTo,
      reset,
      deploy,
      refId,
      onChange,
      routes,
    } = this.props;

    let dataSource = value;
    if (keyName === 'workspace') {
      dataSource = value.filter(ws => !ws.isDefault);
    }
    const disabled = ((keyName === 'image' || keyName === 'instanceType') && GLOBAL_DISABLE) ||
                     (keyName === 'group' && DISABLE_GROUP);
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

    const rowSelection = keyName === "user" ? {
      selectedRowKeys,
      onSelect: this.onSelectChange,
      onSelectAll: this.onSelectAll
    } : undefined;
  
    let {
      createKeys,
      columns = [],
      removeActions,
      announcementCustomActions,
      datasetsInGroupsActions,
      buildImageCustomActions,
      disableCreate,
    } = uiParams;

    const newColumnsRender = renderValue(columns, items.items, this.props);
    if (keyName === 'dataset' && (window as any).enableUploadServer) {
      newColumnsRender.push({
        title: intl.formatMessage({ id: 'uploadServerLink' }),
        dataIndex: 'uploadServerLink',
        key: 'uploadServerLink',
        render: renderUploadServerLink,
        sorter: true,
      });
    }
    if (!removeActions) {
      newColumnsRender.push({
        title: intl.formatMessage({ id: "array.table.actions" }),
        dataIndex: "__settings",
        key: "__settings",
        render: (text, record) => {
          return (
            <ButtonGroup>
              <Button icon={"edit"}
                data-testid="edit-button"
                onClick={() => this.edit(record.id)}
              >
              </Button>
              <Button icon="delete"
                data-testid="delete-button"
                disabled={disabled === true}
                onClick={() => this.remove(record.__index)}
              />
            </ButtonGroup>
          );
        }
      });
    }

    if (buildImageCustomActions) {
      newColumnsRender.push({
        title: intl.formatMessage({ id: "array.table.actions" }),
        dataIndex: "__settings",
        key: "__settings",
        render: (text, record) => {
          return (
            <ButtonGroup>
              <Button icon={"search"}
                data-testid="view-button"
                onClick={() => goTo({
                  pathname: `buildImage/${record.id}`,
                  payload: {
                    tab: 'jobs'
                  }
                })}
              ></Button>
              <Button icon={"edit"}
                data-testid="edit-button"
                onClick={() => this.edit(record.id)}
              >
              </Button>
              <Button icon="delete"
                data-testid="delete-button"
                disabled={disabled === true}
                onClick={() => this.remove(record.__index)}
              />
            </ButtonGroup>
          );
        }
      });
    }

    if (announcementCustomActions) {

      newColumnsRender.push({
        title: intl.formatMessage({ id: "array.table.actions" }),
        dataIndex: 'status',
        render: (status, record) => (
          <React.Fragment>
            <Button data-testid="notification-button" type="primary" onClick={() => this.send(record.__index)} disabled={record.status === 'published'}>
              <Icon type="notification" theme="filled" style={{color: 'white'}} />
              Send
            </Button>
            <Button.Group style={{marginLeft: 8, marginTop: 8}}>
              <Button data-testid="edit-button" icon="edit" onClick={() => this.edit(record.id)}></Button>
              <Button data-testid="delete-button" icon="delete" onClick={() => this.remove(record.__index)}></Button>
            </Button.Group>
          </React.Fragment>
        )
      })
    }

    if (datasetsInGroupsActions) {
      newColumnsRender.push({
        title: intl.formatMessage({ id: "array.table.actions" }),
        dataIndex: 'id',
        render: id => {
          return (
            <Button icon={"edit"}
              data-testid="edit-button"
              onClick={() => goTo({
                pathname: `dataset/${id}`,
                payload: {
                  backToGroup: routes[1]
                }
              })}
            />
          )
        }
      })
    }

    return (
      <div>
        <ButtonGroup
          style={{
            marginBottom: '16px',
            display: 'block',
            textAlign: 'right'
          }}
        >
          {((!createKeys || createKeys.length > 0) && !disableCreate) && (
            <Button
              onClick={this.add}
              data-testid="add-button"
              disabled={disabled === true}
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
        <StyledTable
          pagination={showPagination}
          dataSource={dataSource.map((datum, i) => {
            return {...datum, __index: i, key: datum.key || i};
          })}
          onChange={this.handleTableChange}
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
          title="Send Email Form"
          destroyOnClose
        >
          <EmailForm
            ids={selectedRowKeys}
            closeModal={this.closeModal}
          />
        </Modal>
      </div>
    );
  }
}
