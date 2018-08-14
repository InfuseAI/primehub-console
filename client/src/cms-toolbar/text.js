import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Input} from 'antd';
import {FilterPlugin, Label} from './share';
import {injectIntl} from 'react-intl';

@injectIntl
export default class TextFilter extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    name: PropTypes.string,
    label: PropTypes.string,
    intl: Object
  };

  onInput = e => {
    const {name, onChange} = this.props;
    const {value} = e.target;
    if (!value) {
      onChange();
    } else {
      onChange({
        [name]: {
          contains: value
        }
      });
    }
  }

  render() {
    const {label, intl} = this.props;
    const matched = label.match(/\$\{(.*)\}/);
    const intlLabel = matched ? intl.formatMessage({
      id: matched[1],
      defaultMessage: label
    }) : label;
    return (
      <FilterPlugin>
        <Label>{intlLabel}</Label>
        <Input
          style={{width: '150px'}}
          placeholder={intlLabel}
          onChange={this.onInput}
        />
      </FilterPlugin>
    );
  }
}
