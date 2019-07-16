import * as React from 'react';
import {Select, Input} from 'antd';
const Option = Select.Option;

interface Props {
  size?: 'large' | 'small' | 'default';
  onChange?: any;
  refId?: any;
  isReactComponent?: boolean;
  value?: any;
}

interface State {
  unit: any;
  number: number;
}

export default class Expires extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    const value = props.value || {};
    this.state = {
      number: value.number || 0,
      unit: value.unit || 'hours',
    };
  }

  componentDidMount() {
    const {isReactComponent, value} = this.props;
    if (!isReactComponent) {
      const minutes = value / 60;
      let hours = 0;
      if (minutes >= 60) {
        hours = minutes / 60;
        this.setState({
          number: hours,
          unit: 'hours'
        });
      } else {
        this.setState({
          number: minutes,
          unit: 'minutes'
        });
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isReactComponent) {
      const value = nextProps.value;
      this.setState(value);
    }
  }

  handleNumberChange = (e) => {
    const number = parseInt(e.target.value || 0, 10);
    if (isNaN(number)) {
      return;
    }
    this.setState({ number });
    this.triggerChange({ number });
  }

  handleUnitChange = (unit) => {
    this.setState({ unit });
    this.triggerChange({ unit });
  }

  triggerChange = (changedValue) => {
    // Should provide an event to pass value to Form.
    const {refId, onChange, isReactComponent} = this.props;
    const newValue = {...this.state, ...changedValue};
    if (isReactComponent) {
      onChange(newValue);
    } else {
      // in canner component
      const secs = parseToSecond(newValue);
      onChange(refId, 'update', secs)
    }
  }

  render() {
    const { size } = this.props;
    const state = this.state;
    return (
      <span>
        <Input
          data-testid="expires-in-input"
          type="text"
          size={size}
          value={state.number}
          onChange={this.handleNumberChange}
          style={{ width: '80px', marginRight: '24px' }}
          min="0"
        />
        <Select
          data-testid="expires-in-select"
          value={state.unit}
          size={size}
          style={{ width: '120px' }}
          onChange={this.handleUnitChange}
        >
          <Option data-testid="expires-in-option-hours" value="hours">Hours</Option>
          <Option data-testid="expires-in-option-minutes" value="minutes">Minutes</Option>
        </Select>
      </span>
    );
  }
}

function parseToSecond(expiresIn) {
  const {number, unit} = expiresIn;

  switch (unit) {
    case 'hours': 
      return number * 60 * 60;
    case 'minutes':
      return number * 60;
  }
}