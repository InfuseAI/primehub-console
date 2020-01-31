import * as React from 'react';
import { Input } from 'antd';
import Log from 'components/job/log';

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
      rows={rows}
    />;
  }
}
