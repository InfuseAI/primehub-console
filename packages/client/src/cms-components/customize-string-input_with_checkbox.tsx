import React, { PureComponent } from 'react';
import { Input, Checkbox } from 'antd';
import { isNull } from 'lodash';
import RefId from 'canner-ref-id';

type Props =  {
  onChange: (refId: RefId, action: string, value: any) => void;
  value: any;
  disabled: boolean;
  refId: RefId;
  title: React.ReactNode
};

export default class InputWithCheckbox extends PureComponent<Props> {
  onChange = (e: any) => {
    this.props.onChange(this.props.refId, 'update', e.target.value);
  }

  onCheck = (e: any) => {
    const checked = e.target.checked;
    if (checked) {
      this.props.onChange(this.props.refId, 'update', '');
    } else {
      this.props.onChange(this.props.refId, 'update', null);
    }
  }

  render() {
    const { value, disabled, title } = this.props;
    const valueIsNull = isNull(value);
    return (
      <React.Fragment>
        <Checkbox
          onChange={this.onCheck}
          checked={!valueIsNull}
          style={{marginBottom: 8, color: "rgba(0, 0, 0, 0.85)"}}
        >
          {title}
        </Checkbox>
        <Input
          onChange={this.onChange}
          value={value}
          disabled={disabled || valueIsNull}
        />
      </React.Fragment>
    );
  }
}