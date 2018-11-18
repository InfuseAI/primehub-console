import * as React from 'react';
import styled from 'styled-components';
import {Tabs, Input, Row, Col} from 'antd';
import moment from 'moment';
const TabPane = Tabs.TabPane;
const Search = Input.Search;

interface Props {
  changeFilter: Function;
  fields: Array<any>;
  where: any;
}

const Wrapper = styled.div`
  width: 100%;
`

type State = {
  filter: Object
}

export default class TabsFilter extends React.Component<Props, State> {
  state = {
    filter: {}
  }

  componentDidMount() {
    this.onChange("0");
  }

  onChange = (index: string) => {
    const fields = [{
      title: 'Current',
      condition: {
        expiryDate: {
          gt: moment().toISOString()
        }
      }
    }, {
      title: 'Past',
      condition: {
        expiryDate: {
          lt: moment().toISOString()
        }
      }
    }];
    this.props.changeFilter({
      ...fields[Number(index)].condition
    });
    this.setState({
      filter: fields[Number(index)].condition
    });
  }

  render() {
    const {where} = this.props;
    const fields = [{
      title: 'Current',
      condition: {
        expiryDate: {
          gt: moment().toISOString()
        }
      }
    }, {
      title: 'Past',
      condition: {
        expiryDate: {
          lt: moment().toISOString()
        }
      }
    }];
    let activeKey = 0;
    if (where.expiryDate && where.expiryDate.lt) {
      activeKey = 1;
    }
    return (
      <Wrapper>
        <Tabs activeKey={`${activeKey}`} defaultActiveKey="0" onChange={this.onChange}>
          {fields.map((field, i) => (
            <TabPane tab={field.title} key={i}></TabPane>
          ))}
        </Tabs>
      </Wrapper>
    );
  }
}