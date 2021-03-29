import * as React from 'react';
import { Card } from 'antd';
import emptyBox from 'images/empty-box.svg';

export const Empty = (props: {style?: object, height?: number, description?: any}) => (
  <Card
    style={{
      width: '100%',
      height: props.height,
      ...props.style
    }}
    bodyStyle={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%'
    }}
  >
    <div style={{textAlign: 'center'}}>
      <img src={emptyBox} />
      <p style={{marginTop: 12, color: '#aaa'}}>
        {props.description || 'no data'}
      </p>
    </div>
  </Card>
)
