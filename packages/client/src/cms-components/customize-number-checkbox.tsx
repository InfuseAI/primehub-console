import React, { PureComponent } from "react";
import { InputNumber, Checkbox, Input } from "antd";
import isNaN from "lodash/isNaN";
import isNull from 'lodash/isNull';

export default class CheckableInputNumber extends PureComponent {
  constructor(props) {
    super(props);
    const {uiParams} = props;
    this.defaultValue = 0;
    if ('min' in uiParams) {
      this.defaultValue = uiParams.min;
    }

    if ('defaultValue' in uiParams) {
      this.defaultValue = uiParams.defaultValue;
    }

  }

  onChange = (val) => {
    const {onChange, refId, uiParams: {min}} = this.props;
    if (val >= min) {
      onChange(refId, "update", val);
    }
  }

  onCheck = (e) => {
    const {checked} = e.target;
    const {onChange, refId} = this.props;
    onChange(refId, "update", checked ? this.defaultValue : null);
  }

  render() {
    const { value, uiParams, disabled } = this.props;
    return (
      <React.Fragment>
        <Checkbox onChange={this.onCheck} checked={!isNull(value)} style={{marginRight: 8}}/>
        {
          isNull(value) ? (
            <Input
              disabled
              value={uiParams.disableText || "unlimited"}
              style={{width: 'auto'}}
            />
          ) : (
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
          )
        }
      </React.Fragment>
    );
  }
}
