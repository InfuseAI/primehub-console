import React from 'react';
import {Icon, Button} from 'antd';

const GLOBAL_DISABLE = (window as any).disableMode || false;
const DISABLE_GROUP = (window as any).disableGroup || false;
const DISABLE_BUILD_IMAGE = !(window as any).customImageSetup;


type Props = {
  add: () => void;
  display: string;
  style: Object;
}

export default class AddButton extends React.Component<Props> {
  render() {
    const {add, display, style, keyName} = this.props;
    const disabled = ((keyName === 'image' || keyName === 'instanceType') && GLOBAL_DISABLE) ||
                     (keyName === 'group' && DISABLE_GROUP) ||
                     (keyName === 'buildImage' && DISABLE_BUILD_IMAGE);
    return (
      <Button
        onClick={add}
        disabled={disabled === true}
        type="primary"
        data-testid="add-button"
        style={{
          marginLeft: 'auto',
          marginRight: 16,
          minWidth: 99,
          alignItems: 'center',
          display,
          ...style
        }}
      >
        <Icon type="plus" />
        <span style={{marginLeft: 16}}>Add</span>
      </Button>
    )
  }
}
