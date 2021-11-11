import React from 'react';
import { Input, Select } from 'antd';
import { isValidCron } from 'cron-validator';

import type { RecurrenceType } from './types';

const recurrenceOptions = [
  { value: 'inactive', text: 'On Demand' },
  { value: 'daily', text: 'Every Day (at 4:00am)' },
  { value: 'weekly', text: 'Every Week (Sundays at 4:00am)' },
  { value: 'monthly', text: 'Every Month (on the 1st at 4:00am)' },
  { value: 'custom', text: 'Custom' },
];

export const recurrenceValidator = (rules, value, callback) => {
  // we skip validate empty cron here for better ui
  if (value.type === 'inactive' || !value.cron || isValidCron(value.cron)) {
    return callback();
  }

  return callback('Invalid cron format');
};

interface Value {
  type: RecurrenceType;
  cron?: string;
}

interface Props {
  value: Value;
  onChange: (value: Value) => void;
}

export function RecurrenceInput({ value, onChange }: Props) {
  function onSelect(type) {
    switch (type) {
      case 'daily':
        return onChange({ type, cron: '0 4 * * *' });
      case 'weekly':
        return onChange({ type, cron: '0 4 * * 1' });
      case 'monthly':
        return onChange({ type, cron: '0 4 1 * *' });
      case 'inactive':
        return onChange({ type, cron: '' });
      case 'custom':
        return onChange({ ...value, type });
      default:
        return onChange(value);
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <Select value={value.type} onChange={onSelect} style={{ width: '300px' }}>
        {recurrenceOptions.map(option => (
          <Select.Option key={option.value} value={option.value}>
            {option.text}
          </Select.Option>
        ))}
      </Select>

      {value.type !== 'inactive' && (
        <Input
          value={value.cron}
          placeholder='* * * * *'
          style={{
            width: '150px',
            marginLeft: '12px',
            marginRight: '12px',
          }}
          disabled={
            value.type === 'daily' ||
            value.type === 'weekly' ||
            value.type === 'monthly'
          }
          onChange={event => {
            onChange({ ...value, cron: event.target.value });
          }}
        />
      )}

      {value.type === 'custom' && (
        <a
          href='https://en.wikipedia.org/wiki/Cron'
          target='_blank'
          rel='noreferrer'
        >
          Cron Reference
        </a>
      )}
    </div>
  );
}
