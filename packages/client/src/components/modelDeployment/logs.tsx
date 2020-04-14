import React from 'react';
import Logs from 'components/share/log';
import { Select } from 'antd';

const BASE_LOG_ENDPOINT = '/';

type Props = {
  pods: Array<{
    name: string;
    logEndpoint: string;
  }>;
}

type State = {
  logEndpoint: string;
}

export default class ModelDeploymentLogs extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const firstPod = (props.pods || {})[0] || {};
    this.state = {
      logEndpoint: firstPod.logEndpoint || ''
    };
  }

  render() {
    const {logEndpoint} = this.state;
    const {pods = []} = this.props;
    return (
      <>
        <span>Filters: </span>
        <Select style={{width: 250}} placeholder="Select replica" value={logEndpoint} onChange={logEndpoint => this.setState({logEndpoint})} >
          {pods.map(pod => (
            <Select.Option key={pod.name} value={pod.logEndpoint}>{pod.name}</Select.Option>
          ))}
        </Select> 
        <Logs endpoint={logEndpoint} />
      </>
    );
  }
}