import React, { PureComponent } from "react";
import { InputNumber } from "antd";
import {Props} from './types';

export default class Input extends PureComponent<Props> {
  constructor(props) {
    super(props);
    const {value, routerParams: {operator}} = props;
    // if EnableSharedVolume has been set
    // this field can't update anymore
    // NOTE: this value is created in enableShared component
  }

  onChange = (val) => {
    const {onChange, refId, uiParams: {min}} = this.props;
    if ((window as any).disableEnableSharedVolume) {
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
        disabled={disabled || (window as any).disableEnableSharedVolume}
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
