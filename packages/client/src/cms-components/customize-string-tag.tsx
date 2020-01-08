import * as React from 'react';
import { Tag } from 'antd';

export default class Logs extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {value} = this.props;
    return <Tag>{value}</Tag>;
  }
}
