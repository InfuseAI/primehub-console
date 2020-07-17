import React from 'react';
import { get } from 'lodash';
import Logs from 'components/share/log';
import {DeploymentInfo, Phase} from 'ee/components/modelDeployment/common';
import { Select } from 'antd';

type Props = {
  pods: DeploymentInfo['pods'];
  refetchPhDeployment: Function
}

type State = {
  podName: string;
}

export default class ModelDeploymentLogs extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const firstPod = (props.pods || {})[0] || {};
    this.state = {
      podName: firstPod.name
    };
  }

  shouldRetryAfterFetched = async () => {
    // only retry when the pod is still running
    const {podName} = this.state;
    const {refetchPhDeployment} = this.props;
    const {data} = await refetchPhDeployment();
    const pod = get(data, 'phDeployment.pods', [])
      .find(pod => pod.name === podName);
    return pod.phase === Phase.Running;
  }

  render() {
    const {podName} = this.state;
    const {pods = []} = this.props;
    const selectedPod = pods.find(pod => pod.name === podName) || {};
    return (
      <>
        <span>Replicas: </span>
        <Select style={{width: 450}} disabled={!pods.length} placeholder="Select replica" value={podName || '-'} onChange={podName => this.setState({podName})} >
          {pods.map(pod => (
            <Select.Option key={pod.name} value={pod.name}>{pod.name}</Select.Option>
          ))}
        </Select> 
        <Logs
          style={{marginTop: 16}}
          endpoint={selectedPod.logEndpoint}
          shouldRetryAfterFetched={this.shouldRetryAfterFetched}
        />
      </>
    );
  }
}
