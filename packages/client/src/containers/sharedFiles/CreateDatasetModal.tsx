import * as React from 'react';
import styled from 'styled-components';
import {
  Form,
  Input,
  Icon,
  Select,
  Modal,
  Progress,
  Typography,
  notification,
} from 'antd';
import { useHistory } from 'react-router-dom';
import type { ModalProps } from 'antd/lib/modal';

import DatasetTags from 'components/datasets/DatasetTags';
import { useInterval } from 'hooks/useInterval';
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
  files: string[];
  datasetList: Array<{ id: string; name: string }>;
  type: 'create' | 'update';
  sourePrefix: string;
  onOkClick: () => void;
  onFileRemove: (file: string) => void;
  onModalClose: () => void;
  onCompleteUpload: () => void;
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
}

export function CreateDatasetModal({
  files,
  datasetList,
  type,
  form,
  onFileRemove,
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

  const history = useHistory();

  const stepOne = React.useMemo(() => {
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
            <CustomFormItem
              label='Tags'
              style={{ fontWeight: 700, marginBottom: '8px' }}
            >
              {form.getFieldDecorator('tags', {
                initialValue: [],
              })(<DatasetTags />)}
            </CustomFormItem>
          </>
        ) : (
          <CustomFormItem label='Dataset Name'>
            {form.getFieldDecorator('id', {
              initialValue: 'Select Dataset',
            })(
              <Select style={{ width: '100%' }}>
                {datasetList.map(({ id, name }) => (
                  <Select.Option key={id} value={name}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            )}
          </CustomFormItem>
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
  }, [datasetList, files, form, onFileRemove, type]);

  const modalContents = {
    1: stepOne,
    2: <Progress percent={progress} status='active' />,
    3: <UploadComplete status={uploadedResult} />,
  };

  useInterval(
    async () => {
      if (target.endpoint && progress !== 100) {
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
        props.onCompleteUpload();
        setFetching(false);
        setUploadingToDataset(false);
        setUploadResult('success');
        setSteps(n => n + 1);
      }
    },
    fetching ? 1000 : null
  );

  React.useEffect(() => {
    return () => {
      if (steps === 3 && uploadedResult === 'success') {
        setSteps(1);
        setProgress(0);
        setTarget(null);
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
        style: {
          display: uploadingToDataset ? 'none' : 'inline-block',
        },
      }}
      onOk={() => {
        if (progress === 100) {
          history.replace(`datasets/${target.id}`);
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
              setSteps(n => n + 1);
              setFetching(true);

              const { endpoint } = await props.onCopyFiles({
                id: values.id,
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
            setSteps(n => n + 1);
            setFetching(true);

            try {
              const { endpoint } = await props.onCopyFiles({
                id: values.id,
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
        });
      }}
      onCancel={() => {
        if (uploadedResult === 'failure') {
          window.location.reload();
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
        type='check'
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
