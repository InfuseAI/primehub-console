import React from 'react';
import Logs from 'components/share/log';
import { Select } from 'antd';

const BASE_LOG_ENDPOINT = '/';

type Props = {
  availableReplicas: Array<string>;
}

type State = {
  activeReplicaName: string;
}

export default class ModelDeploymentLogs extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeReplicaName: (props.availableReplicas || [])[0] || ''
    };
  }

  render() {
    const {activeReplicaName} = this.state;
    const {availableReplicas = []} = this.props;
    return (
      <>
        <span>Filters: </span>
        <Select style={{width: 250}} placeholder="Select replica" value={activeReplicaName} onChange={activeReplicaName => this.setState({activeReplicaName})} >
          {availableReplicas.map(replicaName => (
            <Select.Option key={replicaName} value={replicaName}>{replicaName}</Select.Option>
          ))}
        </Select> 
        <Logs endpoint={`${BASE_LOG_ENDPOINT}${activeReplicaName}`} />
      </>
    );
  }
}