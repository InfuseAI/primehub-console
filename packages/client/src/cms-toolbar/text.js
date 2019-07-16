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
    const {label, intl, search, placeholder, name} = this.props;
    
    return (
      <FilterPlugin>
        <Label>{i18n(label, intl)}</Label>
        <Input
          style={{width: '150px'}}
          placeholder={i18n(placeholder, intl)}
          onChange={this.onInput}
          onPressEnter={search}
          data-testid={`text-filter-${name}`}
        />
      </FilterPlugin>
    );
  }
}

function i18n(text, intl) {
  if (text && typeof text === 'string') {
    const matched = text && text.match && text.match(/{(.*)}/);
    const intlText = matched ? intl.formatMessage({
      id: matched[1]
    }) : text;
    return intlText;
  }
  return text;
}