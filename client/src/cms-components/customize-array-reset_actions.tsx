import * as React from 'react';
import {Select} from 'antd';
const Option = Select.Option;

interface Props {
  onChange?: any;
  refId?: any;
  isReactComponent?: boolean;
  defaultValue?: any;
  value?: Array<string>
}

export default class ResetActions extends React.Component<Props> {

  onChange = (v: Array<string>) => {
    const {refId, onChange, isReactComponent} = this.props;
    if (isReactComponent) {
      onChange(v);
    } else {
      // used in canner component
      onChange(refId, 'update', v);
    }
  }

  render() {
    const {value} = this.props;
    return (
      <Select
        mode="multiple"
        data-testid="reset-actions-select"
        onChange={this.onChange}
        style={{
          width: '100%'
        }}
        value={value}
      >
        <Option data-testid={`reset-actions-option-verify-email`} value="VERIFY_EMAIL">Verify Email</Option>
        <Option data-testid={`reset-actions-option-update-profile`}  value="UPDATE_PROFILE">Update Profile</Option>
        <Option data-testid={`reset-actions-option-configure-otp`}  value="CONFIGURE_TOTP">Configure OTP</Option>
        <Option data-testid={`reset-actions-option-update-password`}  value="UPDATE_PASSWORD">Update Password</Option>
      </Select>
    )
  }
}