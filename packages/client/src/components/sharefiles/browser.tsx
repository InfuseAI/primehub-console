import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {errorHandler} from 'utils/errorHandler';
import {get} from 'lodash';
import {appPrefix} from 'utils/env';
import { Table, Alert } from 'antd';

type Props = {
  path: string;
  groupName: string;
  onPathChanged?: Function;
  data?: any;
};

export const GET_FILES = gql`
  query files($where: StoreFileWhereInput!) {
    files (where: $where) {
      prefix
      phfsPrefix
      items {
        name
        size
        lastModified
      }
    }
  }
`;

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';
const isPhfsEnabled = (): boolean => {
  return (window as any).enablePhfs;
};

// Ref: https://stackoverflow.com/a/14919494/563353
const humanFileSize = (bytes, si=false, dp=1) => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(dp) + ' ' + units[u];
};

const getViewContentUrl = (prefix, name) => {
  return `${appPrefix}files/${prefix}/${name}`
}

const getDownloadUrl = (prefix, name) => {
  return `${appPrefix}files/${prefix}/${name}?`
}

class Browser extends React.Component<Props> {

  public handleFolderClick = (folder) => {
    const {
      path: path,
      onPathChanged
    } = this.props;
    const targetPath = path + folder;
    if (onPathChanged) {
      onPathChanged(targetPath);
    }
  }

  public render = () => {
    return <div style={{minHeight: 480}}>{this.renderContent()}</div>;
  }

  private renderContent = () => {
    const {data, path} = this.props;

    if (!isPhfsEnabled()) {
      return <Alert
      message='Warning'
      description='PHFS is not enabled. Please tell your administrator to enable it.'
      type='warning'
      showIcon
      />;
    }

    if (!data.files) {
      return null;
    }

    if (data.error) {
      return getMessage(data.error);
    }

    if (data.loading) {
      return 'Loading...';
    }

    const columns = [
      {
        title: 'File',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Size',
        dataIndex: 'size',
        key: 'size',
      },
    ];
    let dataSource = [];

    if (data.files && data.files && data.files.items) {
      const prefix = data.files.prefix;
      dataSource = data.files.items.map(item =>
        {
          const itemName: String = item.name || '';
          let nameCell;

          if (itemName.endsWith('/')) {
            nameCell = <a onClick={() => this.handleFolderClick(itemName)}>{item.name}</a>;
          } else {
            nameCell = itemName;
          }

          return {
            name: nameCell,
            size: humanFileSize(item.size, true, 1),
          }
        }
      );
    }

    const pagination = {
      hideOnSinglePage: true,
      showSizeChanger: true,
      defaultPageSize: 25,
      pageSizeOptions: ['10', '25', '50', '100']
    };

    return <div>
      <div>{`Path: ${path}`}</div>
      <Table dataSource={dataSource} columns={columns} pagination={pagination}/>
    </div>
  }
}

export default graphql(GET_FILES, {
  options: (props: Props) => ({
    variables: {
      where: {
        phfsPrefix: props.path,
        groupName: props.groupName,
      }
    },
    fetchPolicy: 'network-only',
    onError: errorHandler,
    skip: !isPhfsEnabled(),
    })
  })
(Browser);
