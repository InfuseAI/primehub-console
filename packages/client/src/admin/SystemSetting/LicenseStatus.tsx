import * as React from 'react';
import { Tag } from 'antd';
import { TagProps } from 'antd/lib/tag';

export type LicenseStatus = 'unexpired' | 'invalid' | 'expired';

interface Props extends TagProps {
  status: LicenseStatus;
}

export function LicenseTag({ status, ...props }: Props) {
  const statusColors = {
    unexpired: {
      color: 'blue',
      name: 'Activated',
    },
    invalid: {
      color: 'red',
      name: 'Unauthorized',
    },
    expired: {
      color: 'orange',
      name: 'Expired',
    },
  };

  const { color, name } = statusColors[status.toLowerCase()];

  return (
    <Tag color={color} {...props}>
      {name}
    </Tag>
  );
}
