import * as React from 'react';
import {DatePicker, Select, Icon} from 'antd';
import moment from 'moment';
import styled from 'styled-components';
import {Props} from './types';

const Option = Select.Option;

const Wrapper = styled.div`
  display: flex;
  align-items: center;

  .ant-calendar-picker {
    width: 120px;
    i {
      display: none;
    }
  }
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
    console.log(value, hour, minutes);
    const newValue = moment(value || undefined).hour(Number(hour)).minutes(Number(minutes));
    onChange(refId, 'update', newValue.toISOString());
  }

  render() {
    const {value} = this.props;
    const date = moment(value || undefined);
    const timeValue = date.format('HH:mm');
    const minuteStep = 15;
    const timeOptions = genTimeOptions(minuteStep);
    return (
      <Wrapper>
        <DatePicker onChange={this.changeDate} value={date} suffixIcon={null} />
        <Icon type="calendar" theme="outlined" style={{fontSize: 24, margin: '0 12px 0 4px'}} />
        <Select value={value ? timeValue : '00:00'} style={{ width: 120 }} onChange={this.changeTime}>
          {
            timeOptions.map(option => (
              <Option key={option} value={option}>{option}</Option>
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
    minutes += 15;
  }
  return options;
}