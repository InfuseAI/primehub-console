import * as React from 'react';
import { Button, Input, Modal, Form } from 'antd';
import { useParams } from 'react-router-dom';
import Uploader from 'components/Browser/Uploader';
import { Dataset } from './common';
import { FormComponentProps } from 'antd/lib/form';
import DatasetTags from './DatasetTags';
import { isEmpty } from 'lodash';

interface Props extends FormComponentProps {
  dataset?: Pick<Dataset, 'id' | 'tags'>;
  visible: boolean;
  onClose: (datasetId: string) => void;
  onSubmit: (data: { id: string; tags: string[] }) => Promise<void>;
}

export function DatasetCreateForm({
  dataset,
  visible,
  onClose,
  onSubmit,
  form,
}: Props) {
  const { groupName } = useParams<{ groupName: string }>();
  const [id, setId] = React.useState('');
  const [step, setStep] = React.useState(1);
  const submitDisabled =
    isEmpty(form.getFieldValue('id')) || !isEmpty(form.getFieldError('id'));

  function resetAndClose(datasetId: string) {
    setStep(1);
    onClose(datasetId);
  }

  function cancelAndClose() {
    onClose(null);
  }

  return (
    <>
      <Modal
        title={`${dataset?.id ? 'Edit' : 'New'} Dataset`}
        width={580}
        visible={visible && step === 1}
        footer={[
          <div
            key='create-form-footer'
            style={{
              display: 'flex',
              justifyContent: 'right',
              padding: '2px 8px',
            }}
          >
            <Button type='default' onClick={cancelAndClose}>
              Cancel
            </Button>
            <Button
              data-testid='create-dataset-button'
              type='primary'
              disabled={submitDisabled}
              onClick={async () => {
                form.validateFields(async (err, values) => {
                  if (err) return;
                  setId(values.id);
                  await onSubmit(values);
                  if (!dataset) {
                    setStep(2);
                  } else {
                    onClose(null);
                  }
                  form.resetFields();
                });
              }}
            >
              {dataset?.id ? 'Update Information' : 'Create Dataset'}
            </Button>
          </div>,
        ]}
        onCancel={cancelAndClose}
      >
        <Form>
          <Form.Item label={`Dataset Name`} style={{ marginBottom: '8px' }}>
            {form.getFieldDecorator('id', {
              initialValue: dataset?.id || '',
              rules: [
                {
                  whitespace: true,
                  required: true,
                  message: 'Please input a name!',
                },
                {
                  pattern: /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/,
                  message: `alphanumeric characters, '-' or '_' , and must start with an alphanumeric character.`,
                },
              ],
            })(<Input data-testid='dataset-name' disabled={!!dataset} />)}
          </Form.Item>
          <Form.Item label={`Tags`} style={{ marginBottom: '8px' }}>
            {form.getFieldDecorator('tags', {
              initialValue: dataset?.tags || [],
            })(<DatasetTags />)}
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={'Upload Files (Step 2 of 2)'}
        width={580}
        visible={visible && step === 2}
        footer={[
          <Button
            data-testid='upload-done-button'
            key='done'
            type='primary'
            onClick={() => resetAndClose(id)}
          >
            Done
          </Button>,
        ]}
        onCancel={() => resetAndClose(null)}
      >
        <Uploader groupName={groupName} phfsPrefix={`datasets/${id}`} />
      </Modal>
    </>
  );
}

export default Form.create<Props>()(DatasetCreateForm);
