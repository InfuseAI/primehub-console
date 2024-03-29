import * as React from 'react';
import styled from 'styled-components';
import TextFilter from './text';
// import DateRangeFilter from './dateRange';
import { Button, Row, Col } from 'antd';
import isEmpty from 'lodash/isEmpty';
import { FormattedMessage } from 'react-intl';
import defaultMessage from './locale';

export const FilterRow = styled(Row)`
  width: 100%;
  border: 1px #f8f8f8 solid;
  padding: 15px;
  box-shadow: 1px 1px 4px #eee;
`;

export const FilterPlugins = styled.div`
  flex: 1;
  margin-right: 15px;
  min-width: 100px;
`;

export const ButtonCol = styled(Col)`
  text-align: right;
  padding-top: 16px;
`;

class FilterGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      condition: {},
    };
  }

  onChange = (cond, key) => {
    const condition = { ...this.state.condition };
    if (isEmpty(cond)) {
      delete condition[key];
      this.setState({
        condition,
      });
    } else {
      Object.keys(cond).forEach(key => {
        const newCond = cond[key];
        if (newCond === undefined) {
          delete condition[key];
        } else {
          condition[key] = cond[key];
        }
      });
      this.setState({
        condition,
      });
    }
  };

  submit = () => {
    const { condition } = this.state;
    this.props.changeFilter(condition);
  };

  render() {
    const { fields, where } = this.props;
    const filters = fields.map((val, i) => {
      switch (val.type) {
        case 'text':
        default:
          return (
            <TextFilter
              key={i}
              defaultValue={(where[val.key] || {}).contains || ''}
              onChange={cond => this.onChange(cond, val.key)}
              name={val.key}
              label={val.label}
              placeholder={val.placeholder}
              search={this.submit}
            />
          );
      }
    });
    if (!filters.length) return null;
    return (
      <FilterRow type='flex' justify='space-between' align='bottom'>
        <Col span={20}>
          <FilterPlugins>{[filters]}</FilterPlugins>
        </Col>
        <ButtonCol span={4}>
          <Button
            data-testid='search-button'
            icon='search'
            onClick={this.submit}
          >
            <FormattedMessage
              id='query.filter.search'
              defaultMessage={defaultMessage.en['query.filter.search']}
            />
          </Button>
        </ButtonCol>
      </FilterRow>
    );
  }
}

export default styled(FilterGroup)`
  .ant-input,
  .ant-select-selection {
    height: 32px;
    line-height: 32px;
    border-radius: 20px;
  }

  .ant-select-selection__placeholder {
    height: 28px;
    line-height: 28px;
  }

  .ant-select-dropdown {
    border-radius: 2px !important;
  }
`;
