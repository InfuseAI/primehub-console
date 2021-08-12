import * as React from 'react';
import { Button } from 'antd';
import { ButtonProps } from 'antd/lib/button';

type Props = {
  style?: React.CSSProperties;
  htmlType?: 'submit' | 'button' | 'reset';
} & ButtonProps;

export default function InfuseButton(props: Props) {
  const { style, ...rest } = props;
  return (
    <Button
      style={{
        minWidth: 99,
        alignItems: 'center',
        ...style,
      }}
      {...rest}
    />
  );
}
