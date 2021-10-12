import * as React from 'react';
import { timezones } from 'react-timezone';
import { Select } from 'antd';

const Option = Select.Option;

interface Props {
  value: string;
  onChange: (timezone: string) => void;
}

function stringifyZone(zone: { label: string; offset: number }) {
  const ensure2Digits = num => (num > 9 ? `${num}` : `0${num}`);

  return `(GMT${zone.offset < 0 ? '-' : '+'}${ensure2Digits(
    Math.floor(Math.abs(zone.offset))
  )}:${ensure2Digits(Math.abs((zone.offset % 1) * 60))}) ${zone.label}`;
}

export function TimeZone({ onChange, ...props }: Props) {
  const [timezone, setTimeZone] = React.useState('Asia/Taipei');

  React.useEffect(() => {
    if (props?.value) {
      setTimeZone(props.value);
    }
  }, [props]);

  return (
    <Select
      showSearch
      style={{ width: 350 }}
      data-testid='timezone-select'
      placeholder='Select a timezone'
      optionFilterProp='children'
      onChange={onChange}
      value={timezone}
      filterOption={(input, option) =>
        (option.props.children as string)
          .toLowerCase()
          .indexOf(input.toLowerCase()) >= 0
      }
    >
      {timezones
        .filter(zone => zone.label.toLowerCase().replace(/\s+/g, ''))
        .map(zone => (
          <Option
            key={zone}
            value={zone.name}
            data-testid={`timezone-option-${zone.name}`}
          >
            {stringifyZone(zone)}
          </Option>
        ))}
    </Select>
  );
}
