import React, { useEffect, useContext, useState } from 'react';
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
import { useHistory } from 'react-router-dom';
import { graphql } from 'react-apollo';
import { get } from 'lodash';
import type { ColumnProps } from 'antd/lib/table';

import Uploader from 'components/sharedFiles/uploader';
import InfuseButton from 'components/infuseButton';
import iconMore from 'images/icon-more.svg';
import {
  GroupContext,
  GroupContextValue,
  withGroupContext,
} from 'context/group';
import { errorHandler } from 'utils/errorHandler';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { useClipboard } from 'hooks/useClipboard';

import NotebookViewer from './NotebookView';
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

function normalizedPath(path = '/') {
  /**
   * Normalize the path to the format '/this/is/a/path/
   * 1. Always have leading slash
   * 2. Always have tailing slash
   */
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (!path.endsWith('/')) {
    path = `${path}/`;
  }

  return path;
}

function BreadcrumbPaths({
  path,
  onCreate,
}: {
  path: string;
  onCreate: () => void;
}) {
  const history = useHistory();
  const { name } = useContext(GroupContext);
  const { appPrefix } = useRoutePrefix();

  const paths = normalizedPath(path).split('/');
  const items = [];

  paths.forEach((path, i) => {
    if (i === 0) {
      items.push(
        <Breadcrumb.Item key={i}>
          <a onClick={() => history.push(`${appPrefix}g/${name}/browse`)}>
            {name}
          </a>
        </Breadcrumb.Item>
      );
    } else if (i < paths.length - 1) {
      items.push(
        <Breadcrumb.Item
          key={i}
          onClick={() => {
            const targetPath = paths.slice(0, i + 1).join('/');
            history.push(`${appPrefix}g/${name}/browse${targetPath}`);
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

  return <Breadcrumb>{items}</Breadcrumb>;
}

function ShareFileActions({
  prefix,
  path,
  ...props
}: FileItem & {
  prefix: string;
  path: string;
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
        copyName(`phfs://${normalizedPath(path)}${props.name}`);
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
    actions.push(DownloadFile);
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

interface BrowseSharedFilesFCProps {
  path: string;
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

function BrowseSharedFiles({ data, path, ...props }: BrowseSharedFilesFCProps) {
  const history = useHistory();

  const { appPrefix } = useRoutePrefix();
  const { name: groupName } = useContext(GroupContext);

  const [enabledPHFS, setEndabledPHFS] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFilePath, setPreviewFilePath] = useState('');

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
                  const prefixPath = history.location.pathname;
                  const appendPath = name.replace('/', '');

                  history.push(`${prefixPath}/${appendPath}`);
                }}
              >
                {name}
              </a>
            </>
          );
        }

        return (
          <>
            <Icon style={iconStyle} type='file' />
            {name}
          </>
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
      render: function RednerActions(item: FileItem) {
        return (
          <ShareFileActions
            {...item}
            prefix={get(data, 'files.prefix', '')}
            path={path}
            onPreviewFile={path => setPreviewFilePath(path)}
            onDelete={() => {
              onFilesDeleted(item);
            }}
          />
        );
      },
    },
  ];

  function onFilesDeleted({ name }: FileItem) {
    const isFolder = name.endsWith('/');
    const targetDeletePath = `${history.location.pathname.replace(
      `${appPrefix}g/${groupName}/browse/`,
      ''
    )}/`;

    try {
      Modal.confirm({
        title: `Are you sure to delete '${name}'?`,
        onOk: async () => {
          const { data } = await props.deleteFiles({
            variables: {
              where: {
                groupName,
                phfsPrefix: `${targetDeletePath}${name}`,
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
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (typeof window === undefined) return;

    if (window?.enablePhfs) {
      setEndabledPHFS(true);
    }
  }, []);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {isEditing ? (
          <Input.Search
            autoFocus
            enterButton='Confirm'
            defaultValue={`${history.location.pathname.replace(
              `${appPrefix}g/${groupName}/browse`,
              ''
            )}/`}
            onBlur={() => {
              setTimeout(() => {
                setIsEditing(false);
              }, 200);
            }}
            onSearch={value => {
              setIsEditing(false);
              const basePath = `${appPrefix}g/${groupName}/browse`;

              if (value === '') {
                history.push(basePath);
                return;
              }

              if (value.length > 1000) {
                notification.error({
                  message: 'Path contains consecutive slashes.',
                  duration: 10,
                  placement: 'bottomRight',
                });
                return;
              }

              if (value.includes('//')) {
                notification.error({
                  message: 'Path too long. (length > 1000)',
                  duration: 10,
                  placement: 'bottomRight',
                });
                return;
              }

              history.push(`${basePath}${value}`);
            }}
          />
        ) : (
          <BreadcrumbPaths
            path={path}
            onCreate={() => {
              setIsEditing(true);
            }}
          />
        )}

        <InfuseButton
          icon='upload'
          type='primary'
          style={{ marginLeft: 16 }}
          onClick={() => setIsUploading(true)}
        >
          Upload
        </InfuseButton>
      </div>

      <Table
        rowKey={data => data.name}
        loading={data?.loading}
        dataSource={get(data, 'files.items', [])}
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
        visible={isUploading}
        footer={[
          <Button
            key='ok'
            type='primary'
            onClick={() => {
              setIsUploading(false);
              data?.refetch();
            }}
          >
            OK
          </Button>,
        ]}
        onCancel={() => {
          setIsUploading(false);
        }}
      >
        <Uploader dirPath={get(data, 'files.prefix', '')} />
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
    options: (props: { path: string; groupContext: GroupContextValue }) => ({
      variables: {
        where: {
          phfsPrefix: props.path,
          groupName: props.groupContext.name,
        },
      },
      fetchPolicy: 'cache-and-network',
      onError: errorHandler,
    }),
  }),
  graphql(DELETE_FILES, {
    options: (props: { path: string; groupContext: GroupContextValue }) => ({
      onError: errorHandler,
      refetchQueries: [
        {
          query: GET_FILES,
          variables: {
            where: {
              phfsPrefix: props.path,
              groupName: props.groupContext.name,
            },
          },
        },
      ],
    }),
    name: 'deleteFiles',
  })
)(BrowseSharedFiles);
