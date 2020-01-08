import * as React from 'react';

export default class Logs extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {value} = this.props;
    return <span>{value}</span>;
  }
}
