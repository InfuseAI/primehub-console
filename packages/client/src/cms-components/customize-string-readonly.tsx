import * as React from 'react';

export default class Logs extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {value, format=(text) => text} = this.props;
    return <span>{format(value)}</span>;
  }
}
