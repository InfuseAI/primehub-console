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
    const {label, intl, search, placeholder} = this.props;
    const matched = placeholder && placeholder.match && placeholder.match(/{(.*)}/);
    const intlPlaceholder = matched ? intl.formatMessage({
      id: matched[1]
    }) : placeholder;
    return (
      <FilterPlugin>
        <Label>{label}</Label>
        <Input
          style={{width: '150px'}}
          placeholder={intlPlaceholder}
          onChange={this.onInput}
          onPressEnter={search}
        />
      </FilterPlugin>
    );
  }
}
