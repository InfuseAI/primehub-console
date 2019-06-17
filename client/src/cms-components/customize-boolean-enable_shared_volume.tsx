import React from 'react';
import {Switch} from 'antd';
import {Props} from './types';
import {get} from 'lodash';

export default class EnableSharedVolume extends React.Component<Props> {
  onChange = (checked) => {
    const {onChange, refId, routerParams} = this.props;
    onChange(refId, 'update', checked);
    if (!checked) {
      this.removeSharedVolumeFields();
    }
    if (checked) {
      this.setDefaultSharedVolumeFields();

    }
  }

  componentDidMount() {
    const {value, routerParams} = this.props;
    console.log(this.props);
    if (routerParams.operator === 'create' && value === false) {
      this.removeSharedVolumeFields();
    }
  }

  removeSharedVolumeFields = () => {
    const {onChange, refId, rootValue} = this.props;
    const parentRefId = refId.remove(1)
    onChange(parentRefId.child('sharedVolumeCapacity'), 'update',  undefined);
    onChange(parentRefId.child('launchGroupOnly'), 'update', undefined);
  }

  setDefaultSharedVolumeFields = () => {
    const {onChange, refId} = this.props;
    const parentRefId = refId.remove(1);
    onChange(parentRefId.child('sharedVolumeCapacity'), 'update',  1);
    onChange(parentRefId.child('launchGroupOnly'), 'update', true);
  }

  render() {
    const {value} = this.props;
    return (
      <Switch onChange={this.onChange} checked={value} />
    );
  }
}

function getRecordValue(rootValue, refId) {
  return get(rootValue, refId.remove().getPathArr());
}