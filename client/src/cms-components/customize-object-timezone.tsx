import * as React from 'react';
import {timezones} from 'react-timezone';
import {Select} from 'antd';

const Option = Select.Option;

interface Props {
  onChange: Function,
  refId: any,
  value: any,
  offset: number
}

interface State {
  focus: boolean,
  query: string,
  currentZone: any
}

export default class TimeZone extends React.Component<Props> {
  static defaultProps = {
    value: '',
    offset: 'GMT',
    className: '',
    style: {},
    inputProps: {},
  };

  state = {
    focus: null,
    query: '',
    currentZone: this.props.value ? timezones.find(zone => zone.name === this.props.value) : null,
  };

  static getDerivedStateFromProps(props, state) {
    if (props.value !== (state.currentZone ? state.currentZone.name : '')) {
      return { currentZone: timezones.find(zone => zone.name === props.value) };
    }
    return null;
  }

  stringifyZone(zone, offset): string {
    const ensure2Digits = num => (num > 9 ? `${num}` : `0${num}`);

    return `(${offset}${zone.offset < 0 ? '-' : '+'}${ensure2Digits(Math.floor(Math.abs(zone.offset)))}:${ensure2Digits(Math.abs((zone.offset % 1) * 60))}) ${zone.label}`;
  }

  timezones() {
    if (!this.state.query.trim()) return timezones;

    return timezones.filter(zone =>
      zone.label
        .toLowerCase()
        .replace(/\s+/g, '')
        .includes(this.state.query.toLowerCase().replace(/\s+/g, '')));
  }

  onChange = (name) => {
    const zone = timezones.find(timezone => timezone.name === name);
    const {refId, value, onChange} = this.props;
    onChange(refId, 'update', {...value, name, offset: zone.offset});
  };

  render() {
    const {value, offset = 0} = this.props;
    console.log(value)
    return (
      <Select
        showSearch
        style={{ width: 350 }}
        placeholder="Select a timezone"
        optionFilterProp="children"
        onChange={this.onChange}
        value={value && value.name}
        filterOption={(input, option) => (option.props.children as string).toLowerCase().indexOf(input.toLowerCase()) >= 0}
      >
        {this.timezones().map((zone, index) => (
          <Option key={zone} value={zone.name}>
            {this.stringifyZone(zone, offset)}
          </Option>
        ))}
      </Select>
    );
  }
}
