import React from 'react';
import Logs from 'components/share/log';
import { Select } from 'antd';

const BASE_LOG_ENDPOINT = '/';

type Props = {
  pods: Array<string>;
}

type State = {
  podName: string;
}

export default class ModelDeploymentLogs extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      podName: (props.pods || [])[0] || ''
    };
  }

  render() {
    const {podName} = this.state;
    const {pods = []} = this.props;
    return (
      <>
        <span>Filters: </span>
        <Select style={{width: 250}} placeholder="Select replica" value={podName} onChange={podName => this.setState({podName})} >
          {pods.map(replicaName => (
            <Select.Option key={replicaName} value={replicaName}>{replicaName}</Select.Option>
          ))}
        </Select> 
        <Logs endpoint={`${BASE_LOG_ENDPOINT}${podName}`} />
      </>
    );
  }
}