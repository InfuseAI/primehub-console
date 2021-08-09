import * as React from 'react';
import { Input, Select, Modal } from 'antd';

import type { TToleration } from './types';

interface Props {
  type: 'create' | 'update';
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  currentToleration?: TToleration;
  setToleration: React.Dispatch<React.SetStateAction<TToleration>>;
}

export function TolerationModalForm({ type, visible, ...props }: Props) {
  return (
    <Modal
      title={type ? 'Create Toleration' : 'Edit Toleration'}
      visible={visible}
      onOk={() => props.onOk()}
      onCancel={() => props.onCancel()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="toleration-key">Key</label>
          <Input
            id="toleration-key"
            value={props?.currentToleration?.key}
            onChange={(event) =>
              props.setToleration((prev) => ({
                ...prev,
                key: event.target.value,
              }))
            }
          />
        </div>

        <div
          style={{
            display:
              props?.currentToleration?.operator === 'Equal' ? 'flex' : 'none',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <label htmlFor="toleration-value">Value</label>
          <Input
            id="toleration-value"
            value={props?.currentToleration?.value}
            onChange={(event) =>
              props.setToleration((prev) => ({
                ...prev,
                value: event.target.value,
              }))
            }
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="toleration-operator">Operator</label>
          <Select
            id="toleration-operator"
            value={props?.currentToleration?.operator || 'Exists'}
            onChange={(value) => {
              if (value === 'Exists') {
                props.setToleration((prev) => ({ ...prev, value: null }));
              }
              props.setToleration((prev) => ({ ...prev, operator: value }));
            }}
          >
            <Select.Option value="Equal">Equal</Select.Option>
            <Select.Option value="Exists">Exists</Select.Option>
          </Select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="toleration-effect">Effect</label>
          <Select
            id="toleration-effect"
            value={props?.currentToleration?.effect || 'None'}
            onChange={(value) =>
              props.setToleration((prev) => ({ ...prev, effect: value }))
            }
          >
            <Select.Option value="None">None</Select.Option>
            <Select.Option value="NoSchedule">NoSchedule</Select.Option>
            <Select.Option value="PreferNoSchedule">
              PreferNoSchedule
            </Select.Option>
            <Select.Option value="NoExecute">NoExecute</Select.Option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}
