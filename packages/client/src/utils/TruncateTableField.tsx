import * as React from 'react';
import { Tooltip, Typography } from 'antd';

interface TruncateTableFieldPrps {
  text?: string;
  rows?: number;
  defaultCharacter?: string;
  maxWidth?: string;
  maxCharacters?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function TruncateTableField({
  text,
  maxCharacters = 35,
  ...props
}: TruncateTableFieldPrps) {
  if (!text) {
    return null;
  }

  if (text.length > maxCharacters) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          maxWidth: props?.maxWidth || '250px',
          ...props?.style,
        }}
      >
        <Tooltip placement='top' title={text}>
          <Typography.Paragraph
            ellipsis={{ rows: props?.rows || 3 }}
            style={{ marginBottom: 0 }}
          >
            {props?.children || text}
          </Typography.Paragraph>
        </Tooltip>
      </div>
    );
  }

  return (
    <React.Fragment>
      {props?.children || text || props?.defaultCharacter}
    </React.Fragment>
  );
}
