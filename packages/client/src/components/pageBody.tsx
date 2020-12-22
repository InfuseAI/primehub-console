import React from 'react';

type Props = {
  style?: React.CSSProperties;
};
export default class PageBody extends React.Component<Props> {
  render() {
    const {
      children,
      style={}
    } = this.props;
    return (
      <div style={{
        margin: '16px',
        padding: '16px',
        background: '#fff',
        ...style,
      }}>
        {children}
      </div>
    )
  }
}
