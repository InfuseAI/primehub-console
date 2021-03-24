import React from 'react';

export const dashOrNumber = value => value === null ? '-' : value;

interface Props {
  instanceType: any;
}

export default class InstanceTypeField extends React.Component<Props> {
  render() {
    const {instanceType} = this.props;
    return (
      <div>
        {instanceType.displayName || instanceType.name}
        <br />
        (CPU: {dashOrNumber(instanceType.cpuLimit)} / Memory: {dashOrNumber(instanceType.memoryLimit)} G / GPU: {dashOrNumber(instanceType.gpuLimit)})
      </div>
    );
  }
}
