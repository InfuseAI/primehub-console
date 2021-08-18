import * as React from 'react';
import { Input, Select, Form, Modal } from 'antd';

import type { TToleration } from './types';

interface Props {
  type: 'create' | 'update';
  visible: boolean;
  currentToleration?: TToleration;
  setToleration: React.Dispatch<React.SetStateAction<TToleration>>;
  onOk: () => void;
  onCancel: () => void;
}

export function TolerationModalForm({
  type,
  visible,
  currentToleration,
  setToleration,
  ...props
}: Props) {
  const disabledOK =
    !currentToleration?.key ||
    (currentToleration?.operator === 'Equal' && !currentToleration?.value);

  React.useEffect(() => {
    if (type === 'create') {
      // initial opeartor and effect value
      setToleration(prev => ({ ...prev, operator: 'Exists', effect: 'None' }));
    }
  }, [setToleration, type]);

  return (
    <Modal
      title={type ? 'Create Toleration' : 'Edit Toleration'}
      visible={visible}
      okButtonProps={{ disabled: disabledOK }}
      onOk={() => props.onOk()}
      onCancel={() => props.onCancel()}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Form.Item label='Key' required>
          <Input
            value={currentToleration?.key}
            onChange={event =>
              setToleration(prev => ({
                ...prev,
                key: event.target.value,
              }))
            }
          />
        </Form.Item>

        <Form.Item
          label='Value'
          required
          style={{
            display:
              currentToleration?.operator === 'Equal' ? 'inline-block' : 'none',
          }}
        >
          <Input
            value={currentToleration?.value}
            onChange={event =>
              setToleration(prev => ({
                ...prev,
                value: event.target.value,
              }))
            }
          />
        </Form.Item>

        <Form.Item label='Operator'>
          <Select
            style={{ width: '100%' }}
            value={currentToleration?.operator || 'Exists'}
            onChange={value => {
              if (value === 'Exists') {
                setToleration(prev => ({ ...prev, value: null }));
              }
              setToleration(prev => ({ ...prev, operator: value }));
            }}
          >
            <Select.Option value='Equal'>Equal</Select.Option>
            <Select.Option value='Exists'>Exists</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label='Effect'>
          <Select
            style={{ width: '100%' }}
            value={currentToleration?.effect || 'None'}
            onChange={value =>
              setToleration(prev => ({ ...prev, effect: value }))
            }
          >
            <Select.Option value='None'>None</Select.Option>
            <Select.Option value='NoSchedule'>NoSchedule</Select.Option>
            <Select.Option value='PreferNoSchedule'>
              PreferNoSchedule
            </Select.Option>
            <Select.Option value='NoExecute'>NoExecute</Select.Option>
          </Select>
        </Form.Item>
      </div>
    </Modal>
  );
}
