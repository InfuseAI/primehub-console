// @flow

import React, { PureComponent, SyntheticEvent } from 'react';
import { Input } from 'antd';
import defaultMessage from "@canner/antd-locales";
import {injectIntl} from 'react-intl';
import RefId from 'canner-ref-id';

// types
type UIParams = {
  rows?: number;
  cols?: number;
  maxlength?: number;
  minlength?: number;
  placeholder?: string;
  placeholderTemplate?: string;
  disabled?: boolean;
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
export default class Textarea extends PureComponent<Props> {
  static defaultProps = {
    uiParams: {
      options: []
    }
  };

  onChange = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    this.props.onChange(this.props.refId, 'update', e.currentTarget.value);
  };

  render() {
    const { value, disabled, intl } = this.props;
    const { uiParams } = this.props;
    let placeholder = '';
    if (uiParams.placeholder) {
      placeholder = uiParams.placeholder;
    }
    if (uiParams.placeholderTemplate) {
      placeholder = intl.formatMessage({
        id: uiParams.placeholderTemplate,
        defaultMessage: defaultMessage.en[uiParams.placeholderTemplate]
      });

    }

    return (
      <Input.TextArea
        {...uiParams}
        disabled={disabled || uiParams.disabled}
        placeholder={placeholder}
        onChange={this.onChange}
        value={value}
      />
    );
  }
}