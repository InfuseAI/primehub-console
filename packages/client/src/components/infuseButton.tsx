import React from 'react';
import {Button} from 'antd';
import {ButtonProps} from 'antd/lib/button';

export default function InfuseButton(props: ButtonProps) {
  const {style, ...rest} = props;
  return (
    <Button
      style={{
        width: 99,
        alignItems: 'center',
        ...style
      }}
      {...rest}
    />
  )
}