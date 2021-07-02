import * as React from 'react';
import { timezones } from 'react-timezone';
import { Select } from 'antd';

const Option = Select.Option;

interface Props {
  value: any;
  offset: number;
  onChange: (timezone: string) => void;
}

export class TimeZone extends React.Component<Props> {
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
    currentZone: this.props.value
      ? timezones.find((zone) => zone.name === this.props.value)
      : null,
  };

  static getDerivedStateFromProps(props, state) {
    if (props.value !== (state.currentZone ? state.currentZone.name : '')) {
      return {
        currentZone: timezones.find((zone) => zone.name === props.value),
      };
    }
    return null;
  }

  stringifyZone(zone, offset): string {
    const ensure2Digits = (num) => (num > 9 ? `${num}` : `0${num}`);

    return `(${offset}${zone.offset < 0 ? '-' : '+'}${ensure2Digits(
      Math.floor(Math.abs(zone.offset))
    )}:${ensure2Digits(Math.abs((zone.offset % 1) * 60))}) ${zone.label}`;
  }

  timezones() {
    if (!this.state.query.trim()) return timezones;

    return timezones.filter((zone) =>
      zone.label
        .toLowerCase()
        .replace(/\s+/g, '')
        .includes(this.state.query.toLowerCase().replace(/\s+/g, ''))
    );
  }

  render() {
    const { value, offset = 0 } = this.props;

    return (
      <Select
        showSearch
        style={{ width: 350 }}
        data-testid="timezone-select"
        placeholder="Select a timezone"
        optionFilterProp="children"
        onChange={this.props.onChange}
        value={value && value.name}
        filterOption={(input, option) =>
          (option.props.children as string)
            .toLowerCase()
            .indexOf(input.toLowerCase()) >= 0
        }
      >
        {this.timezones().map((zone) => (
          <Option
            key={zone}
            value={zone.name}
            data-testid={`timezone-option-${zone.name}`}
          >
            {this.stringifyZone(zone, offset)}
          </Option>
        ))}
      </Select>
    );
  }
}
