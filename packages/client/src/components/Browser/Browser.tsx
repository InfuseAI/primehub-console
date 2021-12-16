import React, { useEffect, useContext, useState, useRef } from 'react';
import gql from 'graphql-tag';
import moment from 'moment';
import styled from 'styled-components';
import {
  Table,
  Alert,
  Breadcrumb,
  Icon,
  Input,
  notification,
  Tooltip,
  Menu,
  Dropdown,
  Modal,
  Button,
} from 'antd';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { get, isEmpty } from 'lodash';
import type { ColumnProps } from 'antd/lib/table';

import Uploader, {
  TEXT_UPLOAD_IN_BG,
  TEXT_UPLOAD_IN_BG_MSG,
} from 'components/Browser/Uploader';
import iconMore from 'images/icon-more.svg';
import {
  GroupContext,
  GroupContextComponentProps,
  withGroupContext,
} from 'context/group';
import { TruncateTableField } from 'utils/TruncateTableField';
import { errorHandler } from 'utils/errorHandler';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { useClipboard } from 'hooks/useClipboard';

import NotebookViewer from 'components/NotebookView/NotebookView';
import SharingOptions from './NotebookShareOptions';

export const GET_FILES = gql`
  query files($where: StoreFileWhereInput!) {
    files(where: $where) {
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
  mutation deleteFiles(
    $where: StoreFileWhereInput!
    $options: StoreFileDeleteOptionInput
  ) {
    deleteFiles(where: $where, options: $options)
  }
`;

// Ref: https://stackoverflow.com/a/14919494/563353
function humanFileSize(bytes, si = false, dp = 1) {
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
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + ' ' + units[u];
}

function joinAndNormalize(...paths: string[]) {
  /**
   * Join and normalize the paths to the format '/this/is/a/path/
   * 1. Always have leading slash
   * 2. Always have tailing slash
   */
  const path = paths
    .filter(s => s)
    .flatMap(s => s.split('/'))
    .filter(s => s.length > 0)
    .join('/');
  return path.length > 0 ? `/${path}/` : '/';
}

function BreadcrumbPaths({
  title,
  path,
  changePath,
  onCreate,
  style,
}: {
  title: string;
  path: string;
  onCreate: () => void;
  changePath: (path: string) => void;
  style?: React.CSSProperties;
}) {
  const paths = joinAndNormalize(path).split('/');
  const items = [];

  paths.forEach((path, i) => {
    if (i === 0) {
      items.push(
        <Breadcrumb.Item key={i}>
          <a
            onClick={() => {
              changePath('/');
            }}
          >
            {title}
          </a>
        </Breadcrumb.Item>
      );
    } else if (i < paths.length - 1) {
      items.push(
        <Breadcrumb.Item
          key={i}
          onClick={() => {
            const targetPath = paths.slice(0, i + 1).join('/');
            changePath(targetPath);
          }}
        >
          <a>{path}</a>
        </Breadcrumb.Item>
      );
    } else if (i === paths.length - 1) {
      items.push(
        <Breadcrumb.Item key={i}>
          <Tooltip placement='bottom' title='Choose or create new path'>
            <a onClick={() => onCreate()}>
              <Icon
                type='folder-add'
                theme='filled'
                style={{ position: 'relative', top: '2px', fontSize: '18px' }}
              />
            </a>
          </Tooltip>
        </Breadcrumb.Item>
      );
    }
  });

  return <Breadcrumb style={style}>{items}</Breadcrumb>;
}

function ShareFileActions({
  prefix,
  phfsPrefix,
  ...props
}: FileItem & {
  prefix: string;
  phfsPrefix: string;
  onDelete: () => void;
  onPreviewFile: (path: string) => void;
}) {
  const { appPrefix } = useRoutePrefix();
  const [copyStatus, copyName] = useClipboard({ lazy: true });

  const ViewFile = (
    <Menu.Item key='view'>
      <a
        target='_blank'
        rel='noreferrer'
        href={`${appPrefix}files/${prefix}${props.name}`}
      >
        View file
      </a>
    </Menu.Item>
  );
  const DownloadFile = (
    <Menu.Item key='download'>
      <a href={`${appPrefix}files/${prefix}${props.name}?download=1`}>
        Download file
      </a>
    </Menu.Item>
  );
  const CopyFileURI = (
    <Menu.Item
      key='Copy Uri'
      onClick={() => {
        copyName(`phfs://${joinAndNormalize(phfsPrefix)}${props.name}`);
      }}
    >
      Copy PHFS URI
    </Menu.Item>
  );
  const DeleteFile = (
    <Menu.Item
      key='delete'
      onClick={() => {
        props.onDelete();
      }}
    >
      Delete
    </Menu.Item>
  );

  const actions = [];

  if (/\.(txt|jpg|jpeg|png)$/i.test(props.name)) {
    actions.push(ViewFile);
  }

  if (props.name.endsWith('ipynb')) {
    actions.push(
      <Menu.Item
        key='view'
        onClick={() =>
          props.onPreviewFile(`${appPrefix}files/${prefix}${props.name}`)
        }
      >
        View file
      </Menu.Item>
    );
  }

  if (/\.([a-zA-Z]+)$/i.test(props.name)) {
    actions.push(DownloadFile);
  }

  actions.push(CopyFileURI);
  actions.push(<Menu.Divider key='divider' />);
  actions.push(DeleteFile);

  useEffect(() => {
    if (copyStatus === 'copied') {
      notification.success({
        message: 'Copied!',
        placement: 'bottomRight',
        duration: 5,
      });
    }
  }, [copyStatus]);

  return (
    <Dropdown overlay={<Menu>{actions}</Menu>}>
      <img
        src={iconMore}
        style={{ cursor: 'pointer', width: 16, height: 16 }}
      />
    </Dropdown>
  );
}

const PreviewFileModal = styled(Modal)`
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

interface FileItem {
  name: string;
  size: number;
  lastModified: string;
}

export interface BrowserProps {
  title?: string;
  basePath?: string;
  path?: string;
  enabledPHFS?: boolean;
  rowSelection?: {
    selectedRowKeys: string[];
    onChange: (rowKeys: string[]) => void;
  };
  onPathChange?: (path: string) => void;
  uploading?: boolean;
  onUploadingChange?: (status: boolean) => void;
  onFileUpload?: () => void;
  onFileDelete?: () => void;
}

interface BrowseInternalProps extends GroupContextComponentProps, BrowserProps {
  data?: {
    error: Error | undefined;
    loading: boolean;
    refetch: () => Promise<void>;
    files: {
      prefix: string;
      phfsPrefix: string;
      items: FileItem[];
    };
  };
  deleteFiles: ({
    variables,
  }: {
    variables: {
      where: {
        groupName: string;
        phfsPrefix: string;
      };
      options: {
        recursive: boolean;
      };
    };
  }) => Promise<{ data: { deleteFiles: number } }>;
}

function Browser({
  data,
  enabledPHFS,
  title = '<root>',
  onPathChange: onChange,
  uploading = false,
  onUploadingChange,
  ...props
}: BrowseInternalProps) {
  const path = joinAndNormalize(props.path);

  const { name: groupName } = useContext(GroupContext);

  const [isEditing, setIsEditing] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadSession, setUploadSession] = useState('uploader');

  const [searchText, setSearchText] = useState('');
  const [previewFilePath, setPreviewFilePath] = useState('');
  const refSearch = useRef();

  const changePath = (_path: string) => {
    const newPath = joinAndNormalize(_path);
    if (newPath === path) {
      data?.refetch();
    }

    if (!isEmpty(searchText)) {
      setSearchText('');
      (refSearch as any).current?.input.setValue('');
    }

    if (onChange) {
      onChange(newPath);
    }
  };

  const columns: ColumnProps<FileItem>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (left, right) => left.name.localeCompare(right.name),
      render: function RenderFolderName(name) {
        const iconStyle = { fontSize: '12pt', paddingRight: 16 };

        if (name.endsWith('/')) {
          return (
            <>
              <Icon style={iconStyle} type='folder' />
              <a
                style={{ color: 'rgba(0, 0, 0, 0.65)' }}
                onClick={() => {
                  const appendPath = name.replace('/', '');
                  changePath(`${path}${appendPath}`);
                }}
              >
                {name}
              </a>
            </>
          );
        }

        return (
          <TruncateTableField text={name} maxWidth='700px' rows={1}>
            <Icon style={iconStyle} type='file' />
            {name}
          </TruncateTableField>
        );
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      align: 'right',
      width: 120,
      render: (size, record) => {
        return !record.name.endsWith('/') ? humanFileSize(size, true, 1) : null;
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
        return !record.name.endsWith('/')
          ? moment(lastModified).format('YYYY-MM-DD HH:mm:ss')
          : null;
      },
      sorter: (left, right) => {
        const leftTime = Date.parse(left.lastModified) || 0;
        const rightTime = Date.parse(right.lastModified) || 0;
        return leftTime - rightTime;
      },
    },
    {
      key: 'action',
      align: 'right',
      width: 30,
      render: function RenderActions(item: FileItem) {
        const {
          files: { prefix, phfsPrefix },
        } = data;

        return (
          <ShareFileActions
            {...item}
            prefix={prefix}
            phfsPrefix={phfsPrefix}
            onPreviewFile={path => setPreviewFilePath(path)}
            onDelete={() => {
              handleFileDelete(phfsPrefix, item);
            }}
          />
        );
      },
    },
  ];

  function handleFileDelete(phfsPrefix: string, { name }: FileItem) {
    const isFolder = name.endsWith('/');
    let path = `${phfsPrefix}${name}`;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    try {
      Modal.confirm({
        title: `Are you sure to delete '${name}'?`,
        maskClosable: true,
        onOk: async () => {
          const { data } = await props.deleteFiles({
            variables: {
              where: {
                groupName,
                phfsPrefix: path,
              },
              options: {
                recursive: isFolder,
              },
            },
          });
          notification.success({
            message: isFolder
              ? `${data.deleteFiles} Files deleted`
              : `${name} deleted`,
            duration: 5,
            placement: 'bottomRight',
          });
          if (props.onFileDelete) {
            props.onFileDelete();
          }
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  function handleCloseUpload() {
    const action = () => {
      onUploadingChange(false);
      data?.refetch();
      setUploadInProgress(false);
      setUploadSession('uploader-' + Date.now());
    };

    if (uploadInProgress) {
      Modal.confirm({
        title: TEXT_UPLOAD_IN_BG,
        content: TEXT_UPLOAD_IN_BG_MSG,
        onOk: action,
      });
    } else {
      action();
    }
  }

  if (!enabledPHFS) {
    return (
      <Alert
        showIcon
        message='Warning'
        description='PHFS is not enabled. Please tell your administrator to enable it.'
        type='warning'
      />
    );
  }

  let dataSource: FileItem[] = get(data, 'files.items', []);
  dataSource = dataSource.filter(item => {
    // excludes
    if (item.name === '.dataset') {
      return false;
    }
    // search
    if (!isEmpty(searchText) && !item.name.includes(searchText)) {
      return false;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex' }}>
        {isEditing ? (
          <Input.Search
            style={{ flex: '1' }}
            autoFocus
            enterButton='Confirm'
            defaultValue={path}
            onBlur={() => {
              setTimeout(() => {
                setIsEditing(false);
              }, 200);
            }}
            onSearch={value => {
              setIsEditing(false);

              if (value === '') {
                changePath(value);
                return;
              }

              if (value.length > 1000) {
                notification.error({
                  message: 'Path too long. (length > 1000)',
                  duration: 10,
                  placement: 'bottomRight',
                });
                return;
              }

              changePath(value);
            }}
          />
        ) : (
          <BreadcrumbPaths
            style={{
              flex: '1',
              justifyContent: 'space-between',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
            title={title}
            path={path}
            onCreate={() => {
              setIsEditing(true);
            }}
            changePath={changePath}
          />
        )}

        <Input.Search
          ref={refSearch}
          placeholder='Search file'
          onChange={e => {
            setSearchText(e.target.value);
          }}
          style={{ width: 200, marginLeft: 16 }}
        />
      </div>

      <Table
        rowKey={data => data?.name}
        rowSelection={props?.rowSelection ? props.rowSelection : null}
        loading={data?.loading}
        dataSource={dataSource}
        columns={columns}
        pagination={{
          hideOnSinglePage: false,
          showSizeChanger: true,
          defaultPageSize: 25,
          pageSizeOptions: ['10', '25', '50', '100'],
        }}
      />

      <Modal
        title='Upload'
        visible={uploading}
        footer={[
          <Button key='ok' type='primary' onClick={handleCloseUpload}>
            {uploadInProgress ? TEXT_UPLOAD_IN_BG : 'OK'}
          </Button>,
        ]}
        onCancel={handleCloseUpload}
      >
        <Uploader
          key={uploadSession}
          groupName={groupName}
          phfsPrefix={get(data, 'files.phfsPrefix', '')}
          onUploadStatusChange={uploading => {
            setUploadInProgress(uploading);
          }}
          onFileUpload={() => {
            if (props.onFileUpload) {
              props.onFileUpload();
            }
          }}
        />
      </Modal>

      {previewFilePath && (
        <PreviewFileModal
          visible
          centered
          closable={false}
          bodyStyle={{ height: '80%' }}
          width='80%'
          footer={[]}
        >
          <SharingOptions
            previewFile={previewFilePath}
            onCancel={() => setPreviewFilePath('')}
          />
          <div
            style={{
              maxHeight: Math.floor(window.innerHeight * 0.7),
              overflow: 'scroll',
            }}
          >
            <NotebookViewer previewFile={previewFilePath} />
          </div>
        </PreviewFileModal>
      )}
    </div>
  );
}

export default compose(
  withGroupContext,
  graphql(GET_FILES, {
    options: ({ basePath = '', ...props }: BrowseInternalProps) => ({
      variables: {
        where: {
          phfsPrefix: joinAndNormalize(basePath, props.path),
          groupName: props.groupContext.name,
        },
      },
      fetchPolicy: 'cache-and-network',
      onError: errorHandler,
    }),
    skip: props => !props.enabledPHFS,
  }),
  graphql(DELETE_FILES, {
    options: ({ basePath = '', ...props }: BrowseInternalProps) => ({
      onError: errorHandler,
      refetchQueries: [
        {
          query: GET_FILES,
          variables: {
            where: {
              phfsPrefix: joinAndNormalize(basePath, props.path),
              groupName: props.groupContext.name,
            },
          },
        },
      ],
    }),
    name: 'deleteFiles',
  })
)(Browser);
