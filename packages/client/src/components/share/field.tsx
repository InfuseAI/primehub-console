import React from 'react';
import {Row, Col} from 'antd';

export default function Field({
  label,
  labelCol = 8,
  valueCol = 16,
  value,
  type = 'flex',
  style = {},
  labelStyle = {},
  valueStyle = {}
}: {
  label: React.ReactNode,
  labelCol?: number,
  valueCol?: number,
  value: React.ReactNode,
  style?: React.CSSProperties,
  labelStyle?: React.CSSProperties,
  valueStyle?: React.CSSProperties,
  type?: 'vertical' | 'horizontal' | 'flex'
}) {
  if (type === 'vertical') return (
    <div style={{marginBottom: 8, ...style}}>
      <div style={{
        color: '#aaa',
        marginBottom: 8,
        ...labelStyle
      }}>
        {label}
      </div>
      <div style={{color: '#333', ...valueStyle}}>
        {value}
      </div>
    </div>
  )
  if (type === 'flex') return (
    <Row gutter={12} style={{marginBottom: 8, ...style}}>
      <Col span={labelCol} style={{
        color: '#aaa',
        ...labelStyle
      }}>
        {label}
      </Col>
      <Col span={valueCol} style={{wordBreak: 'break-word', ...valueStyle}}>
        {value}
      </Col>
    </Row>
  )

  if (type === 'horizontal') return (
    <div style={{marginBottom: 8,  display: 'flex', ...style}}>
      <span style={{
        color: '#aaa',
        width: 80,
        minWidth: 80,
        marginRight: 16,
        ...labelStyle
      }}>
        {label}
      </span>
      <span style={{wordBreak: 'break-word', width: '100%', ...valueStyle}}>
        {value}
      </span>
    </div>
  )
}