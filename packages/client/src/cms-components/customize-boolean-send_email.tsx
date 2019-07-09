import React from 'react';
import {Checkbox} from 'antd';
import {FormattedMessage} from 'react-intl';
import {Props} from './types';

export default class SendEmail extends React.Component<Props> {
  onChange = (e) => {
    const {onChange, refId} = this.props;
    onChange(refId, 'update', e.target.checked);
  }

  render() {
    const {value} = this.props;
    return (
      <Checkbox onChange={this.onChange} checked={value}>
        <FormattedMessage
          id="anno.sendEmailMessage"
          defaultMessage="Also send announcement via email."
        />
      </Checkbox>
    );
  }
}