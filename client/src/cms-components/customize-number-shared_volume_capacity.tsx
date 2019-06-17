import React, { PureComponent } from "react";
import { InputNumber } from "antd";
import {Props} from './types';

export default class Input extends PureComponent<Props> {
  private disable: boolean;
  constructor(props) {
    super(props);
    const {value, routerParams: {operator}} = props;
    // if original value is not null or 0 or undefined
    // this field can't update anymore
    this.disable = operator === 'update' && Boolean(value);
  }
  componentDidMount() {
    const {uiParams} = this.props;
    this.onChange(uiParams.defaultValue || uiParams.min);
  }

  onChange = (val) => {
    const {onChange, refId, uiParams: {min}} = this.props;
    if (this.disable) {
      return;
    }
    if (val >= min) {
      onChange(refId, "update", val);
    }
  }

  render() {
    const { value, uiParams, disabled } = this.props;

    return (
      <InputNumber
        style={{width: 'auto'}}
        disabled={disabled || this.disable}
        min={uiParams && uiParams.min}
        max={uiParams && uiParams.max}
        step={uiParams && uiParams.step}
        precision={uiParams && uiParams.precision}
        formatter={value => `${value}${uiParams && uiParams.unit ? uiParams.unit : ''}`}
        parser={uiParams && uiParams.parser ? uiParams && uiParams.parser : value => value.replace(/[^0-9\.]/g, '')}
        value={value}
        onChange={this.onChange}
      />
    );
  }
}
