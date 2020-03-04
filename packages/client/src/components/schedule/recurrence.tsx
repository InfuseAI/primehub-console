import {startCase} from 'lodash';

export enum RecurrenceType {
  Inactive = 'inactive',
  Daily = 'daily',
  Ｗeekly = 'weekly',
  Monthly = 'monthly',
  Custom = 'custom',
}

export const getRecurrenceOptionText = (type: RecurrenceType) => {
  switch(type) {
    case RecurrenceType.Custom:
      return 'Custom';
    case RecurrenceType.Daily:
      return 'Every Day (at 4:00am)';
    case RecurrenceType.Monthly:
      return 'Every Week (Sundays at 4:00am)';
    case RecurrenceType.Ｗeekly:
      return 'Every Week (Sundays at 4:00am)';
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
    case RecurrenceType.Ｗeekly:
    case RecurrenceType.Inactive:
      return startCase(recurrenceType);
  }
}

