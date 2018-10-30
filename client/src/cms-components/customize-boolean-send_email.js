import React from 'react';
import {Checkbox} from 'antd';
import {FormattedMessage} from 'react-intl';

export default class SendEmail extends React.Component {
  onChange = (e) => {
    const {onChange} = this.props;
    onChange(refId, 'update', e.target.checked);
  }
  render() {
    const {value} = this.props;
    return (
      <Checkbox onChange={this.onChange} checked={value}>
        <FormattedMessage
          id="sendEmailMessage"
          defaultMessage="Also send announcement via email."
        />
      </Checkbox>,
    );
  }
}