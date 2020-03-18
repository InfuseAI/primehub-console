import React from 'react';
import {Icon, Button} from 'antd';

type Props = {
  add: () => void;
  display: string;
  style: Object;
}

export default class AddButton extends React.Component<Props> {
  render() {
    const {add, display, style} = this.props;
    return (
      <Button
        onClick={add}
        type="primary"
        data-testid="add-button"
        style={{
          marginLeft: 'auto',
          marginRight: 16,
          width: 99,
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