import * as React from 'react';
import {DatePicker, Select} from 'antd';
import moment from 'moment';
import styled from 'styled-components';
import {Props} from './types';

const Option = Select.Option;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`

export default class Date extends React.Component<Props> {
  changeDate = date => {
    const {value, onChange, refId} = this.props;
    const hour = value ? moment(value).hours() : 0;
    const minutes = value ? moment(value).minutes() : 0;
    const newValue = date.hour(hour).minutes(minutes);
    onChange(refId, 'update', newValue.toISOString());
  }

  changeTime = time => {
    const {value, onChange, refId} = this.props;
    const hour = time.split(':')[0];
    const minutes = time.split(':')[1];
    const newValue = moment(value || undefined).hour(Number(hour)).minutes(Number(minutes));
    onChange(refId, 'update', newValue.toISOString());
  }

  render() {
    const {value, uiParams = {}} = this.props;
    const date = moment(value || undefined);
    const timeValue = date.format('HH:mm');
    const timeOptions = genTimeOptions(uiParams.minuteStep || 30);
    return (
      <Wrapper>
        <DatePicker onChange={this.changeDate} value={date} data-testid="date-picker" />
        <Select data-testid="date-select" value={value ? timeValue : '00:00'} style={{ width: 120, marginLeft: 16 }} onChange={this.changeTime}>
          {
            timeOptions.map(option => (
              <Option data-testid={`date-option-${option}`} key={option} value={option}>{option}</Option>
            ))
          }
        </Select>
      </Wrapper>
    );
  }
}

function genTimeOptions(step) {
  let options = [];
  let minutes = 0;
  let time = moment().startOf('day');
  while (minutes < 1440) {
    options.push(time.format('HH:mm'));
    time.add(step, 'm');
    minutes += step;
  }
  return options;
}