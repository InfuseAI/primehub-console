import React from 'react';
import {Switch} from 'antd';
import {Props} from './types';
import {get} from 'lodash';

export default class EnableSharedVolume extends React.Component<Props> {
  private disable: boolean;
  private sharedVolumeCapacity: number;
  private launchGroupOnly: boolean;

  constructor(props) {
    super(props);
    const {rootValue, refId, routerParams, value} = props;
    const recordValue = getRecordValue(rootValue, refId);
    // if the origin value is true, the field can't change anymore,
    // so we have this.disable to check  
    this.disable = value === true;
    this.sharedVolumeCapacity = recordValue.sharedVolumeCapacity;
    this.launchGroupOnly = recordValue.launchGroupOnly;
    if (routerParams.operator === 'create') {
      this.sharedVolumeCapacity = 1;
      this.launchGroupOnly = true;
    }
  }

  componentDidUpdate() {
    const {rootValue, refId} = this.props;
    const recordValue = getRecordValue(rootValue, refId);
    this.sharedVolumeCapacity = recordValue.sharedVolumeCapacity;
    this.launchGroupOnly = recordValue.launchGroupOnly;
  }

  onChange = (checked) => {
    const {onChange, refId, routerParams} = this.props;
    if (this.disable) {
      return;
    }

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
    if (this.disable) {
      return;
    }
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
    const {onChange, refId, rootValue} = this.props;
    const parentRefId = refId.remove(1);
    onChange(parentRefId.child('sharedVolumeCapacity'), 'update',  this.sharedVolumeCapacity);
    onChange(parentRefId.child('launchGroupOnly'), 'update', this.launchGroupOnly);
  }

  render() {
    const {value} = this.props;
    return (
      <Switch onChange={this.onChange} checked={value} disabled={this.disable} />
    );
  }
}

function getRecordValue(rootValue, refId) {
  return get(rootValue, refId.remove().getPathArr(), {});
}