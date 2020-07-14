import React from 'react';
import { get } from 'lodash';
import Log from '../../../components/share/log';
import {Phase} from './phase';

type Props = {
  endpoint: string;
  refetchJob: Function
}

type State = {
  podName: string;
}

export default class JobLog extends React.Component<Props, State> {
  shouldRetryAfterFetched = async () => {
    // only retry when the job is still running
    const {refetchJob} = this.props;
    const {data} = await refetchJob();
    return get(data, 'phJob.phase') === Phase.Running;
  }

  render() {
    const {endpoint} = this.props;
    const enableLogPersistence = (window as any).enableLogPersistence || false;
    return (
      <Log
        endpoint={endpoint}
        enableLogPersistence={enableLogPersistence}
        shouldRetryAfterFetched={this.shouldRetryAfterFetched}
      />
    );
  }
}
