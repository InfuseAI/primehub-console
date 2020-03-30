import React from 'react';

export default class PageBody extends React.Component {
  render() {
    const {children} = this.props;
    return (
      <div style={{
        margin: '16px',
        padding: '16px',
        background: '#fff',
      }}>
        {children}
      </div>
    )
  }
}