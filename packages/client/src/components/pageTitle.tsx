import React from 'react';

type Props = {
  breadcrumb: React.ReactNode;
  title?: React.ReactNode;
  style?: React.CSSProperties;
};

export default class PageTitle extends React.Component<Props> {
  render() {
    const {
      breadcrumb,
      title,
      style = {},
    } = this.props;
    return (
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 24px',
        ...style
      }}>
        {breadcrumb}
      </div>
    )
  }
}
