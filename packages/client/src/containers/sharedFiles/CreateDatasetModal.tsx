import * as React from 'react';
import gql from 'graphql-tag';
import styled from 'styled-components';
import { ApolloConsumer } from 'react-apollo';
import {
  Button,
  Form,
  Input,
  Icon,
  TreeSelect,
  Modal,
  Progress,
  Typography,
  notification,
} from 'antd';
import { useHistory } from 'react-router-dom';
import type { ApolloClient, ApolloQueryResult } from 'apollo-client';
import type { ModalProps } from 'antd/lib/modal';
import type { AntTreeNode } from 'antd/lib/tree';

import DatasetTags from 'components/datasets/DatasetTags';
import { useInterval } from 'hooks/useInterval';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { errorHandler } from 'utils/errorHandler';

const CustomFormItem = styled(Form.Item)`
  margin-bottom: 8px;
  label {
    font-weight: 700;
  }
`;

const FileItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 96%;

  .filename {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .filename > span {
    margin-left: 8px;
    color: #365abd;
  }
`;

interface Props extends Omit<ModalProps, 'onOk'> {
  form: any;
  groupName: string;
  files: string[];
  data: TreeNode[];
  type: 'create' | 'update';
  sourePrefix: string;
  onOkClick: () => void;
  onFileRemove: (file: string) => void;
  onModalClose: () => void;
  onCreateDataset: (data: { id: string; tags: string[] }) => Promise<void>;
  onCopyFiles: ({
    id,
    path,
    items,
  }: {
    id: string;
    path: string;
    items: string[];
  }) => Promise<{ endpoint: string }>;
  onFetchProgress: ({
    endpoint,
    onError,
  }: {
    endpoint: string;
    onError: () => void;
  }) => Promise<{
    status: 'running' | 'completed' | 'failed';
    progress: number;
    failReason: string;
  }>;
  getFolderTree: ({
    data,
    eventKey,
  }: {
    data: ApolloQueryResult<unknown>;
    eventKey: string;
  }) => void;
}

export type TreeNode = {
  key: string;
  value: string;
  title: string;
  icon?: React.ReactNode;
};

export function CreateDatasetModal({
  files,
  data,
  type,
  form,
  groupName,
  onFileRemove,
  getFolderTree,
  ...props
}: Props) {
  const [steps, setSteps] = React.useState(1);
  const [fetching, setFetching] = React.useState(null);
  const [target, setTarget] =
    React.useState<{ id: string; endpoint: string }>(null);
  const [progress, setProgress] = React.useState(0);
  const [uploadingToDataset, setUploadingToDataset] = React.useState(false);
  const [uploadedResult, setUploadResult] =
    React.useState<'idle' | 'success' | 'failure'>('idle');

  const resetModalKey = 'reset-modal-key';
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  const stepOne = React.useMemo(() => {
    function onLoadTreeNodes({
      client,
      node,
    }: {
      client: ApolloClient<unknown>;
      node: AntTreeNode;
    }): Promise<void> {
      return new Promise(resolve => {
        if (node.props.children.length > 0) {
          resolve();
        } else {
          const GET_FILES = gql`
            query files($where: StoreFileWhereInput!) {
              files(where: $where) {
                prefix
                phfsPrefix
                items {
                  name
                }
              }
            }
          `;

          const { eventKey } = node.props;
          client
            .query({
              query: GET_FILES,
              variables: {
                where: {
                  groupName,
                  phfsPrefix: `/datasets/${eventKey}`,
                },
              },
            })
            .then(data => {
              setTimeout(() => {
                getFolderTree({ data, eventKey });
                resolve();
              }, 1000);
            })
            .catch(console.error);
        }
      });
    }

    return (
      <>
        {type === 'create' ? (
          <>
            <CustomFormItem label='Dataset Name'>
              {form.getFieldDecorator('id', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: 'Please input a name!',
                  },
                  {
                    pattern: /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/,
                    message: `alphanumeric characters, '-' or '_' , and must start with an alphanumeric character.`,
                  },
                ],
              })(<Input autoFocus data-testid='dataset-name' />)}
            </CustomFormItem>
            <CustomFormItem label='Tags' style={{ marginBottom: '8px' }}>
              {form.getFieldDecorator('tags', {
                initialValue: [],
              })(<DatasetTags />)}
            </CustomFormItem>
          </>
        ) : (
          <ApolloConsumer>
            {client => (
              <CustomFormItem label='Select Dataset'>
                {form.getFieldDecorator('id', {
                  initialValue: undefined,
                  rules: [
                    {
                      required: true,
                      message: 'Please select a dataset',
                    },
                  ],
                })(
                  <SelectTreeNode
                    data={data}
                    loadData={(node: AntTreeNode) =>
                      onLoadTreeNodes({ client, node })
                    }
                  />
                )}
              </CustomFormItem>
            )}
          </ApolloConsumer>
        )}

        <CustomFormItem label={`Contents (${files.length} Items)`}>
          <div
            style={{
              maxHeight: '220px',
              overflowY: 'scroll',
            }}
          >
            {files.map((file, i) => (
              <FileItem key={`${i}-${file}`}>
                <div className='filename'>
                  <Icon type='paper-clip' />
                  <span>{file}</span>
                </div>
                <Icon
                  type='delete'
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    onFileRemove(file);
                  }}
                />
              </FileItem>
            ))}
          </div>
        </CustomFormItem>
      </>
    );
  }, [files, data, form, groupName, type, onFileRemove, getFolderTree]);

  const modalContents = {
    1: stepOne,
    2: <Progress percent={progress} status='active' />,
    3: <UploadComplete status={uploadedResult} />,
  };

  useInterval(
    async () => {
      if (target?.endpoint && progress !== 100) {
        const { status, progress } = await props.onFetchProgress({
          endpoint: target.endpoint,
          onError: () => {
            setFetching(false);
            setSteps(3);
            setUploadResult('failure');
          },
        });

        if (status === 'failed') {
          setFetching(false);
          setSteps(3);
          setUploadResult('failure');

          notification.error({
            duration: 5,
            placement: 'bottomRight',
            message: 'Failure!',
            description: 'Failure to upload files, please try again later.',
          });
          return;
        }

        setProgress(progress);
      }

      if (progress === 100) {
        setFetching(false);
        setUploadingToDataset(false);
        setUploadResult('success');
        setSteps(3);

        // If the user ever clicked *keep working in background*, close the notiification messages
        notification.close(resetModalKey);
      }
    },
    fetching ? 1000 : null
  );

  // cleanup modal status
  React.useEffect(() => {
    return () => {
      if (steps === 3 && uploadedResult === 'success') {
        setTimeout(() => {
          setSteps(1);
          setProgress(0);
          setFetching(false);
          setUploadingToDataset(false);
          setUploadResult('idle');
          setTarget(null);
        }, 200);
      }
    };
  });

  return (
    <Modal
      maskClosable={false}
      centered
      {...props}
      okText={
        progress === 100
          ? 'View Dataset'
          : type === 'create'
          ? 'Create Dataset'
          : 'Add files to Dataset'
      }
      cancelText={
        uploadedResult === 'failure'
          ? 'Close'
          : uploadingToDataset
          ? 'Keep working in background'
          : 'Cancel'
      }
      okButtonProps={{
        disabled: files.length === 0 && uploadedResult !== 'success',
        style: {
          display: uploadingToDataset ? 'none' : 'inline-block',
          cursor:
            files.length === 0 && uploadedResult !== 'success'
              ? 'not-allowed'
              : 'default',
        },
      }}
      onOk={() => {
        if (progress === 100) {
          history.push(`${appPrefix}g/${groupName}/datasets/${target.id}`);
          return;
        }

        form.validateFields(async (err, values) => {
          if (err) {
            return;
          }

          if (type === 'create') {
            try {
              await props.onCreateDataset(values);

              props.onOkClick();
              setUploadingToDataset(true);
              setSteps(2);
              setFetching(true);

              const { endpoint } = await props.onCopyFiles({
                id: values.id,
                // Creating a new dataset default path is `/` without any nested structure
                path: '/',
                items: files.map(file => `/${props.sourePrefix}${file}`),
              });

              if (endpoint && !target) {
                setTarget({
                  id: values.id,
                  endpoint,
                });
              }
            } catch (err) {
              errorHandler(err);
            }
          }

          if (type === 'update') {
            props.onOkClick();
            setUploadingToDataset(true);
            setSteps(2);
            setFetching(true);

            // Check the folder path is nested or not, if is a nested folder path,
            // we need to exclude the root path and put remain path to `path`.
            const isNested = values.id.indexOf('/') === -1 ? false : true;
            const rootFolder = isNested
              ? values.id.slice(0, values.id.indexOf('/'))
              : values.id;
            const nestedFolderPath = isNested
              ? values.id.slice(values.id.indexOf('/'))
              : '/';

            try {
              const { endpoint } = await props.onCopyFiles({
                id: rootFolder,
                path: nestedFolderPath,
                items: files.map(file => `/${props.sourePrefix}${file}`),
              });

              if (endpoint && !target) {
                setTarget({
                  id: values.id,
                  endpoint,
                });
              }
            } catch (err) {
              errorHandler(err);
            }
          }
        });
      }}
      onCancel={() => {
        if (uploadedResult === 'failure') {
          window.location.reload();
          return;
        }

        if (uploadingToDataset) {
          notification.open({
            key: resetModalKey,
            duration: 0,
            message: 'Keep uploading the files in the background?',
            description:
              'The contents will continue to be uploaded in the background and you will no longer see the progress. ',
            placement: 'bottomRight',
            btn: (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  size='small'
                  onClick={() => notification.close(resetModalKey)}
                >
                  No
                </Button>

                <Button
                  type='primary'
                  size='small'
                  onClick={() => {
                    props.onModalClose();
                    notification.close(resetModalKey);

                    setTimeout(() => {
                      setSteps(1);
                      setProgress(0);
                      setFetching(false);
                      setUploadingToDataset(false);
                      setUploadResult('idle');
                      setTarget(null);
                    }, 200);
                  }}
                >
                  Yes
                </Button>
              </div>
            ),
          });
        } else {
          props.onModalClose();
        }
      }}
    >
      {modalContents[steps]}
    </Modal>
  );
}

function UploadComplete({
  status,
}: {
  status: 'idle' | 'success' | 'failure';
}) {
  const isSuccess = status === 'success' ? true : false;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <Icon
        type='close'
        style={{
          width: '70px',
          height: '70px',
          color: '#fff',
          backgroundColor: isSuccess ? '#52C41A' : '#FF4D4F',
          borderRadius: '9999px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px',
          fontWeight: 700,
        }}
      />

      <Typography.Title level={3}>
        {isSuccess ? 'Created Successfully!' : 'Dataset Creation Failed'}
      </Typography.Title>
    </div>
  );
}

function SelectTreeNode({
  value,
  data,
  onChange,
  loadData,
}: {
  data: TreeNode[];
  value?: string;
  onChange?: (value: string) => void;
  loadData: (node: AntTreeNode) => Promise<void>;
}) {
  return (
    <TreeSelect
      treeIcon
      placeholder='Select a dataset'
      style={{ width: '100%' }}
      treeData={data}
      value={value}
      loadData={loadData}
      dropdownStyle={{
        top: '330px',
        maxHeight: '350px',
      }}
      onChange={value => {
        onChange(value);
      }}
    />
  );
}
