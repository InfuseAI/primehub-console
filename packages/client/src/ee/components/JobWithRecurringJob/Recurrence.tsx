import {startCase} from 'lodash';
import React from 'react';
import {Input, Select} from 'antd';
import { isValidCron } from 'cron-validator'

export enum RecurrenceType {
  Inactive = 'inactive',
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Custom = 'custom',
}

export const getRecurrenceOptionText = (type: RecurrenceType) => {
  switch(type) {
    case RecurrenceType.Custom:
      return 'Custom';
    case RecurrenceType.Daily:
      return 'Every Day (at 4:00am)';
    case RecurrenceType.Weekly:
      return 'Every Week (Sundays at 4:00am)';
    case RecurrenceType.Monthly:
      return 'Every Month (on the 1st at 4:00am)';
    case RecurrenceType.Inactive:
      return 'Inactive';
    default:
      return 'Unknown';
  }
}

export const recurrenceOptions = Object.keys(RecurrenceType)
  .map(key => ({
    value: RecurrenceType[key],
    text: getRecurrenceOptionText(RecurrenceType[key]),
  }))

export const renderRecurrence = (recurrenceType: RecurrenceType, cron: string) => {
  switch(recurrenceType) {
    case RecurrenceType.Custom:
      return cron;
    case RecurrenceType.Daily:
    case RecurrenceType.Monthly:
    case RecurrenceType.Weekly:
    case RecurrenceType.Inactive:
      return startCase(recurrenceType);
  }
}

export type Recurrence = {
  type?: RecurrenceType,
  cron?: string;
}

type Props = {
  onChange: (value: Recurrence) => void;
  value: Recurrence;
};

export const recurrenceValidator = (rules, value, callback) => {
  // we skip validate empty cron here for better ui
  if (value.type === "inactive" || !value.cron || isValidCron(value.cron)) return callback();
  return callback('Invalid cron format');
}

export default class RecurrenceInput extends React.Component<Props | any> {
  onSelect = type => {
    const {value = {}, onChange} = this.props;
    switch (type) {
      case RecurrenceType.Daily:
        return onChange({type, cron: '0 4 * * *'});
      case RecurrenceType.Weekly:
        return onChange({type, cron: '0 4 * * 1'});
      case RecurrenceType.Monthly:
        return onChange({type, cron: '0 4 1 * *'});
      case RecurrenceType.Inactive:
        return onChange({type, cron: ''});
      case RecurrenceType.Custom:
        return onChange({ ...value, type});
      default:
        return onChange(value);
    }
  }

  onInput = e => {
    const {value = {}, onChange} = this.props;
    onChange({...value, cron: e.target.value});
  }

  render() {
    const {value = {}} = this.props;
    const {type = RecurrenceType.Inactive, cron} = value;
    const disabled = type === RecurrenceType.Daily ||
      type === RecurrenceType.Weekly ||
      type === RecurrenceType.Monthly;
    return (
      <div style={{ display: 'flex' }}>
        <Select
          value={type}
          style={{
            width: 300
          }}
          onChange={this.onSelect}
        >
          {recurrenceOptions.map(option => (
            <Select.Option
              key={option.value}
              value={option.value}
            >
              {option.text}
            </Select.Option>
          ))}
        </Select>
        {
          type !== RecurrenceType.Inactive && (
            <Input
              style={{
                width: 150,
                marginLeft: 12,
                marginRight: 12
              }}
              value={cron}
              disabled={disabled}
              onChange={this.onInput}
              placeholder="* * * * *"
            />
          )
        }
        {
          type === RecurrenceType.Custom && (
            <a href="https://en.wikipedia.org/wiki/Cron" target="_blank">
              Cron Reference
            </a>
          )
        }
      </div>
    )
  }
}
