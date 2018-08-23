import React, { PureComponent } from "react";
import { InputNumber } from "antd";
import isNaN from "lodash/isNaN";

export default class Input extends PureComponent {
  componentDidMount() {
    const {value, refId, onChange, uiParams} = this.props;
    if (!value && (uiParams.defaultValue || uiParams.min)) {
      setTimeout(() => {
        onChange(refId, 'update', uiParams.defaultValue || uiParams.min);
      }, 500)
    }
  }

  onChange = (val) => {
    const {onChange, refId} = this.props;
    onChange(refId, "update", val);
  }

  render() {
    const { value, uiParams, disabled } = this.props;

    return (
      <InputNumber
        disabled={disabled}
        min={uiParams && uiParams.min}
        max={uiParams && uiParams.max}
        step={uiParams && uiParams.step}
        precision={uiParams && uiParams.precision}
        formatter={value => `${value}${uiParams && uiParams.unit ? uiParams.unit : ''}`}
        parser={value => value.replace(/[^0-9\.]/g, '')}
        value={value || uiParams.defaultValue || uiParams.min}
        onChange={this.onChange}
      />
    );
  }
}