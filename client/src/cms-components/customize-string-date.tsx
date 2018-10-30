import * as React from 'react';
import {DatePicker, Select} from 'antd';
import moment from 'moment';

import {Props} from './types';

const Option = Select.Option;

export default class Date extends React.Component<Props> {
  changeDate = date => {
    const {value, onChange, refId} = this.props;
    const TimeISOString = moment(value).toISOString().split('T')[1];
    const DateISOString = moment(date).toISOString().split('T')[0];
    onChange(refId, 'update', `${DateISOString}T${TimeISOString}`);
  }

  changeTime = time => {
    const {value, onChange, refId} = this.props;
    const timeMoment = moment(time, 'hh:mm');
    const TimeISOString = timeMoment.toISOString().split('T')[1];
    const DateISOString = moment(value).toISOString().split('T')[0];
    onChange(refId, 'update', `${DateISOString}T${TimeISOString}`);
  }

  render() {
    const {value} = this.props;
    const timeValue = moment(value).format('hh:mm');
    const minuteStep = 15;
    const timeOptions = genTimeOptions(minuteStep);
    return (
      <div>
        <DatePicker onChange={this.changeDate} />
        <Select value={timeValue} style={{ width: 120 }} onChange={this.changeTime}>
          {
            timeOptions.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))
          }
        </Select>
      </div>
    );
  }
}

function genTimeOptions(step) {
  let options = [];
  let time = moment().startOf('day');
  while (time.minutes() < 1440) {
    options.push(time.format('hh:mm'));
    time.add(step, 'm');
  }
  return options;
}