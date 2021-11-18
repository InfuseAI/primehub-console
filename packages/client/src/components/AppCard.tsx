import * as React from 'react';
import styled from 'styled-components';
import { Button, Card, Divider, Tag, Typography, Icon } from 'antd';

import AppLogo from 'components/apps/appLogo';

const Description = styled(Typography.Paragraph)`
  display: -webkit-box;
  padding: 0 24px;
  height: 84px;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

interface Props {
  template: {
    id: string;
    icon: string;
    version: string;
    docLink: string;
    description: string | React.ReactNode;
    text: string | React.ReactNode;
    tag: string;
  };
  installable?: boolean;
  onInstall?: () => void;
}

export function AppCard({ template, installable = true, ...props }: Props) {
  return (
    <Card
      style={{
        width: '100%',
        minHeight: '252px',
        height: '100%',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
      bodyStyle={{
        padding: '0px',
      }}
    >
      <div style={{ display: 'flex', padding: '16px 24px' }}>
        <AppLogo src={template.icon} style={{ marginRight: '8px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ margin: '4px 0 0' }}>
            {template.text}{' '}
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {template.version}
            </Typography.Text>
          </h2>
          <Tag>{template.tag}</Tag>
        </div>
      </div>

      <Description>{template.description}</Description>

      <Divider style={{ margin: '12px 0' }} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          margin: '12px 24px',
          gap: '8px',
        }}
      >
        <Button href={`${template.docLink}`} target='_blank'>
          <Icon type='read' /> About
        </Button>
        {installable && (
          <Button type='primary' onClick={() => props?.onInstall()}>
            <Icon type='plus' /> Install to PrimeHub
          </Button>
        )}
      </div>
    </Card>
  );
}
