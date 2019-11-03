import React, { Component } from "react";
import { Table, Button, Modal, Icon, notification } from "antd";
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from "react-intl";
import defaultMessage, {renderValue} from "@canner/antd-locales";
import EmailForm from '../cms-toolbar/sendEmailModal';
import {renderUploadServerLink} from '../../schema/utils';
import {Props} from './types';
import RefId from 'canner-ref-id';
import {get} from 'lodash';

const ButtonGroup = Button.Group;
const confirm = Modal.confirm;
const GLOBAL_DISABLE = (window as any).disableMode || false;

@injectIntl
export default class ArrayNestedJob extends Component<Props> {
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


  view = (recordId) => {
    const {goTo, refId, rootValue} = this.props;
    const jobId = new RefId('buildImageJob');
    const buildImage = get(rootValue, refId.getPathArr().slice(0, 2));
    goTo({
      pathname: `${jobId.toString()}/${recordId}`,
      payload: {
        backToImage: buildImage.id
      }
    });
  }

  remove = (index) => {
    const {onChange, deploy, refId, value, intl} = this.props;
    // const jobId = new RefId('buildImageJob');
    // confirm({
    //   title: intl.formatMessage({ id: "array.table.delete.confirm" }),
    //   okType: 'danger',
    //   onOk() {
    //     onChange(jobId.child(index), 'delete').then(() => {
    //       deploy(jobId.getPathArr()[0], value[index].id);
    //     });
    //   }
    // });
    
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
      onChange
    } = this.props;

  
    let {
      createKeys,
      columns = [],
      removeActions,
      announcementCustomActions
    } = uiParams;

    const newColumnsRender = renderValue(columns, items.items, {
      refId,
      deploy,
      reset,
      onChange,
      goTo,
      uiParams,
      intl
    });

    newColumnsRender.push({
      title: intl.formatMessage({ id: "array.table.actions" }),
      dataIndex: "__settings",
      key: "__settings",
      render: (text, record) => {
        return (
          <ButtonGroup>
            <Button icon={"search"}
              data-testid="view-button"
              onClick={() => this.view(record.id)}
            >
            </Button>
            {/* <Button icon="delete"
              data-testid="delete-button"
              onClick={() => this.remove(record.__index)}
            /> */}
          </ButtonGroup>
        );
      }
    });

    return (
      <div>
        <Table
          pagination={showPagination}
          dataSource={value.map((datum, i) => {
            return {...datum, __index: i, key: datum.key || i};
          })}
          columns={newColumnsRender}
          style={{marginBottom: 32}}
          rowKey="id"
        />
      </div>
    );
  }
}
