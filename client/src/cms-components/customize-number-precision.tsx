import React, { PureComponent } from "react";
import { InputNumber } from "antd";
import {Props} from './types';

export default class Input extends PureComponent<Props> {
  componentDidMount() {
    const {value, refId, onChange, uiParams} = this.props;
    if (!value && (uiParams.defaultValue || uiParams.min)) {
      setTimeout(() => {
        onChange(refId, 'update', uiParams.defaultValue || uiParams.min);
      }, 500)
    }
  }

  onChange = (val) => {
    const {onChange, refId, uiParams: {min}} = this.props;
    if (val >= min) {
      onChange(refId, "update", val);
    }
  }

  render() {
    const { value, uiParams, disabled } = this.props;

    return (
      <InputNumber
        style={{width: 'auto'}}
        disabled={disabled}
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