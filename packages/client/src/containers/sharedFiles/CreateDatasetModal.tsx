import * as React from 'react';
import styled from 'styled-components';
import { Form, Input, Icon, Select, Modal, Progress, Typography } from 'antd';
import { ModalProps } from 'antd/lib/modal';

import DatasetTags from 'components/datasets/DatasetTags';

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
  onOkClick: () => void;
  onFileRemove: (file: string) => void;
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

  const stepOne = React.useMemo(() => {
    return (
      <>
        {type === 'create' ? (
          <>
            <CustomFormItem label='Dataset Name'>
              {form.getFieldDecorator('datasetName', {
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
              })(<Input data-testid='dataset-name' />)}
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
            {form.getFieldDecorator('datasetName', {
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
    // TODO: progress
    2: <Progress percent={50} status='active' />,
    3: <UploadComplete />,
  };

  return (
    <Modal
      maskClosable={false}
      centered
      {...props}
      onOk={() => {
        form.validateFields(err => {
          if (err) {
            return;
          }
          props.onOkClick();
          setSteps(n => n + 1);
        });
      }}
    >
      {modalContents[steps]}
    </Modal>
  );
}

function UploadComplete() {
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
          backgroundColor: '#52C41A',
          borderRadius: '9999px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px',
          fontWeight: 700,
        }}
      />

      <Typography.Title level={3}>Created Successfully!</Typography.Title>
    </div>
  );
}
