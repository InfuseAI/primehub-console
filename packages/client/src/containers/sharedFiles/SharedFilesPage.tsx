import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button, Form, Icon, notification } from 'antd';
import { useHistory, useParams } from 'react-router-dom';
import { compose } from 'recompose';
import { graphql, withApollo } from 'react-apollo';
import type { ApolloQueryResult } from 'apollo-client';
import type { FormComponentProps } from 'antd/lib/form';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Browser from 'components/Browser/Browser';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import { InputVariables } from 'components/datasets/common';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { errorHandler } from 'utils/errorHandler';

import { CreateDatasetModal, TreeNode } from './CreateDatasetModal';
import {
  GetDatasets,
  CreateDatasetMutation,
  CopyFilesMutation,
  ZipFiles,
  JobQueueStatus,
} from './Dataset.graphql';

const StickyFooter = styled.div`
  position: fixed;
  bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  width: 65%;
  height: 72px;
  left: 25%;
  borderradius: 4px;
  background-color: #fff;
  box-shadow: 0px 3px 6px -4px rgba(0, 0, 0, 0.12),
    0px 6px 16px rgba(0, 0, 0, 0.08), 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
`;

interface Props extends FormComponentProps, GroupContextComponentProps {
  datasets: {
    datasetV2Connection: {
      edges: Array<{
        node: {
          id: string;
          name: string;
        };
      }>;
    };
  };
  createDataset: ({
    variables,
  }: {
    variables: {
      payload: InputVariables;
    };
  }) => Promise<void>;
  copyFiles: ({
    variables,
  }: {
    variables: {
      where: {
        id: string;
        groupName: string;
      };
      path: string;
      items: string[];
    };
  }) => Promise<{
    data: { copyFilesToDatasetV2: { endpoint: string } };
  }>;
  zipFiles: ({
    variables,
  }: {
    variables: {
      payload: {
        groupName: string;
        phfsPrefix: string;
        files: string[];
      };
    };
  }) => Promise<void>;
  client: any;
}

interface Node extends TreeNode {
  children?: Node[];
}

function updateFolderTree(nodes: Node[], key: React.Key, children: Node[]) {
  return nodes.map(node => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }

    if (node.children) {
      return {
        ...node,
        children: updateFolderTree(node.children, key, children),
      };
    }

    return node;
  });
}

function ShareFilesPage({ form, datasets, ...props }: Props) {
  const [enabledPHFS, setEndabledPHFS] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [type, setType] = useState<'create' | 'update'>('create');
  const [modalVisible, setModalVisible] = useState(false);
  const [folderTree, setFolderTree] = React.useState<TreeNode[]>([]);

  const history = useHistory();
  const [token] = useLocalStorage('primehub.accessToken', []);
  const { appPrefix } = useRoutePrefix();
  const { groupName, phfsPrefix } =
    useParams<{ groupName: string; phfsPrefix: string }>();

  function handlePathChange(path: string) {
    setSelectedFiles([]);
    history.push(`${appPrefix}g/${groupName}/browse${path}`);
  }

  async function fetchUploadingProgress(endpoint: string) {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(response => response.json());

    return response;
  }

  async function downloadMultiple(selectedFiles: string[]) {
    props.zipFiles({
      variables: {
        payload: {
          groupName,
          phfsPrefix: phfsPrefix || '',
          files: selectedFiles
        },
      },
    }).then( _result => {
      notification.success({
        duration: 3,
        placement: 'bottomRight',
        message: 'Zipping is in progress...',
      });
      const interval = setInterval(async () => {
        const result = await props.client.query({
          query: JobQueueStatus,
          fetchPolicy: 'no-cache',
        });
        if (result.data.jobQueueStatus.completed) {
          notification.success({
            duration: 5,
            placement: 'bottomRight',
            message: `Your zip file ${result.data.jobQueueStatus.file} is ready for download`,
          });
          clearInterval(interval);
        }
      }, 2000);
    }).catch((error) => {
      notification.error({
        duration: 3,
        placement: 'bottomRight',
        message: error.message,
      })
    });
    setSelectedFiles([]);
  }

  function getNextFolderTree({
    data: response,
    eventKey,
  }: {
    data: ApolloQueryResult<unknown>;
    eventKey: string;
  }) {
    setFolderTree(prev => {
      const filterFolder = (
        (response.data as any).files.items as Array<{
          name: string;
        }>
      )
        .filter(file => file.name !== '.dataset')
        .map(file => {
          if (file.name.endsWith('/')) {
            const folderName = file.name.replace('/', '');

            return {
              key: `${eventKey}/${folderName}`,
              value: `${eventKey}/${folderName}/`,
              title: `${folderName}/`,
              icon: <Icon type='folder' />,
            };
          }

          return {
            key: `${eventKey}/${file.name}`,
            value: `${eventKey}/${file.name}`,
            title: file.name,
            disabled: true,
            isLeaf: true,
            icon: <Icon type='file' />,
          };
        });

      return updateFolderTree(prev, eventKey, filterFolder);
    });
  }

  useEffect(() => {
    if (typeof window === undefined) return;

    if (window?.enablePhfs) {
      setEndabledPHFS(true);
    }
  }, []);

  useEffect(() => {
    const datasetList =
      datasets?.datasetV2Connection?.edges.map(({ node }) => node) || [];

    if (datasetList.length > 0) {
      const nextFolderTree = datasetList.map(dataset => ({
        key: dataset.id,
        value: `${dataset.name}/`,
        title: `${dataset.name}/`,
        icon: <Icon type='database' />,
      }));

      setFolderTree(nextFolderTree);
    }
  }, [datasets?.datasetV2Connection?.edges]);

  return (
    <>
      <PageTitle
        title='Shared Files'
        breadcrumb={
          <Breadcrumbs
            pathList={[
              {
                key: 'browse',
                matcher: /\/browse/,
                title: 'Shared Files',
                link: '/browse',
                tips: 'Users can share files in this PHFS storage with group members.',
                tipsLink: 'https://docs.primehub.io/docs/shared-files',
              },
            ]}
          />
        }
      />
      <PageBody style={{ margin: '16px 16px 100px 16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            marginBottom: 16,
          }}
        >
          <InfuseButton
            icon='upload'
            type='primary'
            style={{ marginLeft: 16 }}
            onClick={() => {
              setUploading(true);
            }}
          >
            Upload Files
          </InfuseButton>
        </div>

        <Browser
          title={groupName}
          rowSelection={{
            selectedRowKeys: selectedFiles,
            onChange: (rowKeys: string[]) => setSelectedFiles(rowKeys),
          }}
          path={phfsPrefix || '/'}
          enabledPHFS={enabledPHFS}
          onPathChange={handlePathChange}
          uploading={uploading}
          onUploadingChange={uploading => setUploading(uploading)}
        />

        {selectedFiles.length > 0 && (
          <StickyFooter>
            <b>{selectedFiles.length} items are selected</b>
            <Button.Group>
              <Button
                type='link'
                onClick={() => {
                  setType('update');
                  setModalVisible(true);
                }}
              >
                Add to existing Dataset
              </Button>
              <Button
                type='primary'
                onClick={() => {
                  setType('create');
                  setModalVisible(true);
                }}
              >
                Create New Dataset
              </Button>
              <Button
                disabled={selectedFiles.length < 2}
                type='primary'
                style={{ marginLeft: 16 }}
                onClick={() => {
                  downloadMultiple(selectedFiles);
                }}
              >
                Download
              </Button>
              <Button
                disabled={selectedFiles.length < 2}
                type='primary'
                style={{ marginLeft: 16 }}
              >
                Delete
              </Button>
            </Button.Group>
          </StickyFooter>
        )}

        <CreateDatasetModal
          form={form}
          files={selectedFiles}
          type={type}
          visible={modalVisible}
          sourePrefix={phfsPrefix ? `${phfsPrefix}/` : ''}
          groupName={groupName}
          data={folderTree}
          getFolderTree={getNextFolderTree}
          title={
            type === 'create' ? 'Create Dataset' : 'Add to existing Dataset'
          }
          onModalClose={() => {
            form.resetFields();
            setModalVisible(false);
          }}
          onOkClick={() => {
            setSelectedFiles([]);
          }}
          onFileRemove={file =>
            setSelectedFiles(files => files.filter(f => f !== file))
          }
          onCreateDataset={async (data: { id: string; tags: string[] }) => {
            await props.createDataset({
              variables: {
                payload: {
                  ...data,
                  groupName: props.groupContext.name,
                },
              },
            });
          }}
          onCopyFiles={async ({
            id,
            path,
            items,
          }: {
            id: string;
            path: string;
            items: string[];
          }) => {
            try {
              const {
                data: {
                  copyFilesToDatasetV2: { endpoint },
                },
              } = await props.copyFiles({
                variables: {
                  where: {
                    id,
                    groupName: props.groupContext.name,
                  },
                  path,
                  items,
                },
              });

              return { endpoint };
            } catch (err) {
              errorHandler(err);
            }
          }}
          onFetchProgress={async ({
            endpoint,
            onError,
          }: {
            endpoint: string;
            onError: () => void;
          }) => {
            try {
              const response = await fetchUploadingProgress(endpoint);

              return response;
            } catch (err) {
              onError();
              notification.error({
                duration: 5,
                placement: 'bottomRight',
                message: 'Failure',
                description: 'Failure to upload files, try again later.',
              });
            }
          }}
        />
      </PageBody>
    </>
  );
}

export default compose(
  withGroupContext,
  withApollo,
  graphql(GetDatasets, {
    name: 'datasets',
    options: ({ groupContext }: Props) => {
      return {
        variables: {
          where: {
            groupName: groupContext.name,
          },
        },
        fetchPolicy: 'cache-and-network',
        onError: errorHandler,
      };
    },
  }),
  graphql(CreateDatasetMutation, {
    name: 'createDataset',
    options: ({ groupContext }: Props) => ({
      refetchQueries: [
        {
          query: GetDatasets,
          variables: {
            where: {
              groupName: groupContext.name,
            },
          },
        },
      ],
    }),
  }),
  graphql(CopyFilesMutation, {
    name: 'copyFiles',
  }),
  graphql(ZipFiles, {
    name: 'zipFiles',
  })
)(Form.create<Props>()(ShareFilesPage));
