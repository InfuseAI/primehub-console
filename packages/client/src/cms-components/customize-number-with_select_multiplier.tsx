// @flow

import React, { PureComponent } from "react";
import { InputNumber, Select } from "antd";
import RefId from 'canner-ref-id';

const Option = Select.Option;

// types
type UIParams = {
  options: Array<{
    text: string,
    value: string,
    multiplier: number,
  }>,
  styleOnInput?: any;
  styleOnSelect?: any;
  defaultSelected?: number;
  min?: number;
  max?: number;
  step?: number;
};

type Props =  {
  uiParams: UIParams;
  intl?: any;
  onChange?: any;
  value?: any;
  disabled?: boolean;
  refId?: any;
};

interface State {
  unitNumber: number;
  selectedUnitValue: any;
  selectedUnitOrder: number;
}

//@injectIntl
export default class NumberWithSelectMultipler extends PureComponent<Props, State> {
  static defaultProps = {
    uiParams: {
      options: []
    }
  };

  constructor(props) {
    super(props);

    let { value, uiParams } = this.props;
    let { options, defaultSelected, max } = uiParams;

    if (value) {
      let i;
      for (i=0; i<options.length; i++) {
        if (value / options[i].multiplier <= max ) break;
      }
      this.state = {
        unitNumber: Math.floor(value / options[i].multiplier),
        selectedUnitValue: options[i].value,
        selectedUnitOrder: i
      };
    } else {
      if (defaultSelected && options[defaultSelected] && options[defaultSelected].value) {
        this.state = {
          unitNumber: null,
          selectedUnitValue: options[defaultSelected].value,
          selectedUnitOrder: defaultSelected
        };
      } else {
        this.state = {
          unitNumber: null,
          selectedUnitValue: options[0].value,
          selectedUnitOrder: 0
        };
      }
    }
  }

  onInputChange = (val: any) => {
    const { uiParams, refId } = this.props;
    const { options } = uiParams;
    const state = this.state;

    this.setState({
      unitNumber: val,
    });

    if (refId) {
      this.props.onChange(this.props.refId, 'update', val*options[state.selectedUnitOrder].multiplier);
    } else {
      this.props.onChange(val*options[state.selectedUnitOrder].multiplier);
    }
  }

  onSelectChange = (val: string) => {
    const { uiParams, refId } = this.props;
    const { options } = uiParams;
    const state = this.state;

    let i;
    for (i=0; i<options.length; i++) {
      if (options[i].value == val ) break;
    }
    this.setState({
      selectedUnitValue: options[i].value,
      selectedUnitOrder: i
    });
    if (state.unitNumber) {
      if (refId) {
        this.props.onChange(this.props.refId, "update", state.unitNumber*options[i].multiplier);
      } else {
        this.props.onChange(state.unitNumber*options[i].multiplier);
      }
    }
  };


  render() {
    const { value, disabled } = this.props;
    let { uiParams } = this.props;
    let { options, styleOnInput, styleOnSelect, max } = uiParams;

    const state = this.state;
    if (value && value != state.unitNumber * options[state.selectedUnitOrder].multiplier) {
      let i;
      for (i=0; i<options.length; i++) {
        if (value / options[i].multiplier <= max ) break;
      }
      this.setState({
        unitNumber: Math.floor(value / options[i].multiplier),
        selectedUnitValue: options[i].value,
        selectedUnitOrder: i
      });
    }
    return (
        <React.Fragment>
            <InputNumber
                onChange={this.onInputChange}
                value={state.unitNumber}
                style={styleOnInput || {}}
                min={uiParams && uiParams.min}
                max={uiParams && uiParams.max}
                step={uiParams && uiParams.step}
            />
            <Select
                style={styleOnSelect || {}}
                disabled={disabled}
                value={state.selectedUnitValue}
                onChange={this.onSelectChange}
            >
                {options.map((opt, i) => {
                const { text, value } = opt;
                return (
                    <Option value={value} key={opt.value}>
                    {text || value}
                    </Option>
                );
                })}
            </Select>
        </React.Fragment>
    );
  }
}
