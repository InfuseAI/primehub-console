import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {errorHandler} from 'utils/errorHandler';
import {get} from 'lodash';
import {appPrefix} from 'utils/env';
import { Table, Alert, Breadcrumb, Icon, Input, Skeleton, Menu, Dropdown, Modal, notification, Form, Button } from 'antd';
import { RouteComponentProps, withRouter } from 'react-router';
import {compose} from 'recompose';
import moment from 'moment';
import { ColumnProps } from 'antd/lib/table';
import Uploader from 'components/sharedFiles/uploader';
import InfuseButton from 'components/infuseButton';
import iconShareFiles from 'images/icon-files-gray.svg';
import iconMore from 'images/icon-more.svg';
import SharingOptions from './NotebookShareOptions';
import styled from 'styled-components';
import logo from 'images/primehub-logo-w.svg';
import NotebookViewer from './NotebookView';

interface Props extends RouteComponentProps {
  path: string;
  groupName: string;
  onPathChanged?: Function;
  data?: any;
  deleteFiles: Function;
};

interface ItemType {
  name: string;
  size: number;
  lastModified?: string;
}

interface State {
  editing: boolean;
  uploading: boolean;
  itemCopyUri?: ItemType;
  previewFile?: string;
}

const GET_FILES = gql`
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

const DELETE_FILES = gql`
  mutation deleteFiles($where: StoreFileWhereInput!, $options: StoreFileDeleteOptionInput)  {
    deleteFiles(where:$where, options:$options)
  }
`;

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';
const isPhfsEnabled = (): boolean => {
  return window.enablePhfs;
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

class Browser extends React.Component<Props, State> {

  state: State = {
    editing: false,
    uploading: false,
  };

  refInputPath = undefined;
  refInputPhfsUri = undefined;

  private handleFolderClick = (folder) => {
    const {onPathChanged} = this.props;
    const targetPath = `${this.normalizedPath()}${folder}`;
    if (onPathChanged) {
      onPathChanged(targetPath);
    }
  }

  private handlePathChange = (targetPath) => {
    const {
      onPathChanged
    } = this.props;
    let errorMessage = '';

    targetPath = this.normalizedPath(targetPath);

    if (targetPath.includes("//")) {
      errorMessage = 'Path contains consecutive slashes.'
    } else if (targetPath.length > 1000 ) {
      errorMessage = 'Path too long. (length > 1000)'
    }

    if (errorMessage) {
      notification.error({
        message: errorMessage,
        duration: 10,
        placement: 'bottomRight'
      });
      return;
    }

    if (onPathChanged) {
      onPathChanged(targetPath);
    }
  }

  private handleRefetch = () => {
    const {data} = this.props;
    const {refetch} = data;

    if (refetch) {
      refetch();
    }
  }

  private handleDelete = (item) => {
    const {groupName, deleteFiles} = this.props;
    const isFolder = item.name.endsWith('/') ? true : false;
    const phfsPrefix = (this.normalizedPath() + item.name).substring(1);
    const variables = {
      where: {
        groupName,
        phfsPrefix
      },
      options: {
        recursive: isFolder
      }
    };

    Modal.confirm({
      title: `Are you sure to delete '${item.name}'?`,
      onOk: () => {
        deleteFiles({variables})
        .then((result) => {
          const {data} = result || {} ;
          const deletedConut = (data && data.deleteFiles) || 0;

          const message = isFolder ?
            `${deletedConut} Files deleted` :
            `${item.name} deleted`;
          notification.success({
            message,
            duration: 10,
            placement: 'bottomRight'
          });
        });
      }
    });
  }

  /**
   * Normalize the path to the format '/this/is/a/path/
   * 1. Always have leading slash
   * 2. Always have tailing slash
   */
  private normalizedPath(path = this.props.path) {
    if (!path) {
      return '/'
    }

    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    if (!path.endsWith('/')) {
      path = path + '/'
    }

    return path;
  }

  private getFilePath(filename) {
    const {data} = this.props;
    const {files} = data || {};
    const {prefix} = files || {};
    return `${appPrefix}files/${prefix}${filename}`
  }

  private getPhfsUri(name) {
    return `phfs://${this.normalizedPath()}` + name
  }

  public render = () => {
    if (!isPhfsEnabled()) {
      return <Alert
      message='Warning'
      description='PHFS is not enabled. Please tell your administrator to enable it.'
      type='warning'
      showIcon
      />;
    }

    const styleOverflowX = {
      overflowX: "auto",
      whiteSpace: "nowrap",
    };

    return <div>
      <div style={{display: 'flex'}}>
        <div style={{flex: '1', marginLeft: 15, display: this.state.editing ? 'none' : 'block', ...styleOverflowX}}>{this.renderPathBreadcrumb()}</div>
        <div style={{flex: '1', marginLeft: 15, display: this.state.editing ? 'block' : 'none'}}>{this.renderPathInput()}</div>
        <InfuseButton icon="upload" type="primary" style={{marginLeft: 16}}onClick={()=>{
          this.setState({uploading: true})}
          }>Upload
        </InfuseButton>
      </div>

      {this.renderContent()}
      {this.renderCopyUriModal()}
      {this.renderUploadModal()}
      {this.renderPreviewFile()}
    </div>
  }

  private renderPathBreadcrumb() {
    const currentPath = this.normalizedPath();
    let pathComponents = currentPath.split('/');

    let items = [];
    let tmpPath = '';

    pathComponents.forEach((component, i) => {
      tmpPath += `${component}/`;
      let targetPath = tmpPath;
      const changePath = () => {
        if (targetPath === currentPath) {
          this.handleRefetch()
        } else {
          this.handlePathChange(targetPath)
        }
      };


      if (i == 0) {
        // the root: change to root path
        items.push(<Breadcrumb.Item>
          <a onClick={changePath}><img src={iconShareFiles} style={{width:16, height:16, position:"relative", top:-1}}/></a>
        </Breadcrumb.Item>);
      } else if(i < pathComponents.length - 1 ) {
        // the inermediate path components: change path
        items.push(<Breadcrumb.Item><a onClick={changePath}>{component}</a></Breadcrumb.Item>);
      } else if(i == pathComponents.length - 1 ) {
        // the last one: edit path
        const editPath = () => {
          this.setState({editing: true}, () => {
            this.refInputPath.focus();
          });
        }

        items.push(
          <Breadcrumb.Item>
            <a onClick={editPath}><Icon type="folder-add" theme='filled' style={{fontSize: '14pt', position: 'relative', top: 2}}/></a>
          </Breadcrumb.Item>);
      } else {
        // should not reach here
      }
    });

    return <Breadcrumb>{items}</Breadcrumb>
  }

  private renderPathInput() {

    return <Input
      prefix={<img src={iconShareFiles} style={{width:16, height:16}}/>}
      onPressEnter={(e) => {
        let targetPath = (e.target as any).value;
        this.handlePathChange(targetPath);
        this.setState({editing:false});
      }}
      onFocus={(e) => {e.target.value = this.normalizedPath()}}
      onBlur={() => {this.setState({editing: false})}}
      ref={(input) => {this.refInputPath = input}}
    />
  }

  private renderItemAction = item => {
    const menuItems = [];
    const menuItemView = <Menu.Item key='view'><a target='_blank' href={`${this.getFilePath(item.name)}`}>View file</a></Menu.Item>;
    const menuItemDownload = <Menu.Item key='download'><a href={`${this.getFilePath(item.name)}?download=1`}>Download file</a></Menu.Item>;
    const menuItemCopyUri = <Menu.Item key='Copy Uri'><a onClick={() => {this.setState({itemCopyUri: item})}}>Copy PHFS URI</a></Menu.Item>;
    const menuItemDelete = <Menu.Item key='delete'><a onClick={() => {this.handleDelete(item)}}>Delete</a></Menu.Item>;

    if (item.name.endsWith('/')) {
      // folder
    } else if (item.name.endsWith('txt') ||
        item.name.endsWith('png') ||
        item.name.endsWith('jpg'))
    {
      // viewable file
      menuItems.push(menuItemView);
      menuItems.push(menuItemDownload);
    } else if (item.name.endsWith('ipynb')) {
      // render file
      menuItems.push(
        <Menu.Item key='view'>
          <a
            onClick={() => {
              this.setState({ previewFile: this.getFilePath(item.name) });
            }}
          >
            View file
          </a>
        </Menu.Item>
      );
      menuItems.push(menuItemDownload);
    } else {
      // other format file
      menuItems.push(menuItemDownload);
    }

    menuItems.push(menuItemCopyUri);
    menuItems.push(<Menu.Divider />);
    menuItems.push(menuItemDelete);

    return <Dropdown
            overlay={<Menu>{menuItems}</Menu>}
          >
            <a className='ant-dropdown-link' onClick={e => e.preventDefault()}>
              {/* <IconMore/> */}
              <img src={iconMore} style={{width: 16, height: 16}}/>
            </a>
          </Dropdown>;
  }

  private renderCopyUriModal = () => {
    const {itemCopyUri} = this.state;
    if (!itemCopyUri) {
      return <></>;
    }

    const uri = this.getPhfsUri(itemCopyUri.name);

    return <Modal
      title='Copy PHFS URI'
      okText='Copy'
      visible={true}
      onOk={() => {
        const input = this.refInputPhfsUri;
        input.select();
        document.execCommand('copy');
        notification.success({
          message: 'Copied to clipboard',
          placement: 'bottomRight'
        });
        this.setState({itemCopyUri: undefined});
      }}
      onCancel= {() => {
        this.setState({itemCopyUri: undefined});
      }}
    >
      <Form layout='vertical'>
        <Form.Item label='URI:'>
          <Input value={uri} ref={input => this.refInputPhfsUri = input}/>
        </Form.Item>
      </Form>
    </Modal>;
  }

  private renderUploadModal = () => {
    const {data} = this.props;

    if (!data || !data.files || !data.files.prefix) {
      return null;
    }

    return <Modal
      title='Upload'
      visible={this.state.uploading}
      footer={[
        <Button type='primary' onClick={() => {
          this.setState({uploading: false});
          this.handleRefetch();
        }}>OK</Button>
      ]}
      onCancel={() => {
        this.setState({uploading: false});
        this.handleRefetch();
      }}
    >
      <Uploader dirPath={data.files.prefix} />
    </Modal>;
  }

  private renderContent = () => {
    const {data} = this.props;

    if (!data.files) {
      return null;
    }

    if (data.error) {
      return getMessage(data.error);
    }

    if (data.loading) {
      return <Skeleton active />;
    }

    const columns: Array<ColumnProps<any>> = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: (name, record, index) => {
          const iconStyle = {fontSize: '12pt', paddingRight: 16};
          if (name.endsWith('/')) {
            return <><Icon style={iconStyle} type='folder' /><a style={{color: 'rgba(0, 0, 0, 0.65)'}}onClick={() => this.handleFolderClick(name)}>{name}</a></>;
          } else {
            return <><Icon style={iconStyle} type='file' />{name}</>;
          }
        },
        sorter: (left, right) => left.name.localeCompare(right.name),
      },
      {
        title: 'Size',
        dataIndex: 'size',
        key: 'size',
        align: 'right',
        width: 120,
        render: (size, record) => {
          return !record.name.endsWith('/') ? humanFileSize(size, true, 1) : undefined;
        },
        sorter: (left, right) => {
          const leftSize = left.size || 0;
          const rightSize = right.size || 0;
          return leftSize - rightSize;
        },
      },
      {
        title: 'Last Modified',
        dataIndex: 'lastModified',
        key: 'lastModified',
        align: 'right',
        width: 200,
        render: (lastModified, record) => {
          return !record.name.endsWith('/') ? moment(lastModified).format('YYYY-MM-DD HH:mm:ss') : undefined;
        },
        sorter: (left, right) => {
          const leftTime = Date.parse(left.lastModified) || 0;
          const rightTime = Date.parse(right.lastModified) || 0;
          return leftTime - rightTime;
        },
      },
      {
        title: '',
        key: 'action',
        align: 'right',
        width: 30,
        render: (_, record) => {
          return this.renderItemAction(record);
        },
      },
    ];
    let dataSource = [];

    if (data.files && data.files && data.files.items) {
      dataSource = data.files.items;
    }

    const pagination = {
      hideOnSinglePage: false,
      showSizeChanger: true,
      defaultPageSize: 25,
      pageSizeOptions: ['10', '25', '50', '100']
    };

    return <Table style={{paddingTop: 8}}dataSource={dataSource} columns={columns} pagination={pagination}/>;

  }

  private renderPreviewFile = () => {
    const { previewFile } = this.state;

    if (!previewFile) {
      return <></>;
    }

    const HEADER_HEIGHT = 64;
    const Logo = styled.div`
  background-image: url(${logo});
  background-color: #373d62;
  background-size: 65%;
  background-position: 14px 13px;
  background-repeat: no-repeat;
  width: 200px;
  height: ${HEADER_HEIGHT}px;
` as any;


const StyledModal = styled(Modal)`
  .ant-form-item-label {
    margin-bottom: -4px;
  }
  .ant-form-item {
    margin-bottom: 10px;
  }
  .ant-modal-body {
    padding: 0px;
  }
`;

    const maxHeight = Math.floor(window.innerHeight * 0.7);
    const closeModal = () => {
      this.setState({ previewFile: null });
    }

    return (
      <StyledModal
        closable={false}
        title=""
        centered
        bodyStyle={{ height: '80%' }}
        width='80%'
        visible={true}
        footer={[]}
      >
        <SharingOptions
          inGroupPreview={true}
          previewFile={previewFile}
          onCancel={() => closeModal()}
        />
        <div style={{maxHeight: maxHeight, overflow: "scroll"}}>
          <NotebookViewer previewFile={previewFile} />
        </div>
      </StyledModal>
    );
  };
}

export default compose(
  withRouter,
  graphql(GET_FILES, {
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
  }),
  graphql(DELETE_FILES, {
    options: (props: Props) => ({
      onError: errorHandler,
      refetchQueries: [
        {
          query: GET_FILES,
          variables: {
            where: {
              phfsPrefix: props.path,
              groupName: props.groupName,
            }
          },
        }
      ]
    }),
    name: "deleteFiles"
  }),
)(Browser);
