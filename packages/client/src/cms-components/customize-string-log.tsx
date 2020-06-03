import * as React from 'react';
import Log from 'components/share/log';

type Props = {
  uiParams: {
    rows?: number
  },
  value: string
}
export default class Logs extends React.Component<Props> {
  render() {
    const {uiParams, value} = this.props;
    const {rows} = uiParams;
    return <Log
      endpoint={value}
      style={{clear: "both"}}
      rows={rows}
    />;
  }
}
