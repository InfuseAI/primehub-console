// @flow

import React, { PureComponent } from "react";
import { Select } from "antd";
import defaultMessage from "@canner/antd-locales";
import {injectIntl} from 'react-intl';
import RefId from 'canner-ref-id';

const Option = Select.Option;

// types
type UIParams = {
  options: Array<{
    text: string,
    value: string
  }>,
  style: any;
  defaultSelected?: number
};

type Props =  {
  uiParams: UIParams;
  intl: any;
  onChange: (refId: RefId, action: string, value: any) => void;
  value: any;
  disabled: boolean;
  refId: RefId;
};

@injectIntl
export default class SelectString extends PureComponent<Props> {
  static defaultProps = {
    uiParams: {
      options: []
    }
  };

  onChange = (val: string) => {
    this.props.onChange(this.props.refId, "update", val);
  };

  render() {
    const { value, disabled, intl } = this.props;
    let { uiParams } = this.props;
    let { options, style } = uiParams;
  
    const { defaultSelected } = uiParams;
    return (
      <Select
        style={style || {}}
        disabled={disabled}
        value={
          value ||
          (defaultSelected
          && options[defaultSelected]
          && options[defaultSelected].value)
        }
        placeholder={
          intl.formatMessage({
            id: "string.select.placeholder",
            defaultMessage: defaultMessage.en["string.select.placeholder"]
          })
        }
        onChange={this.onChange}
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
    );
  }
}