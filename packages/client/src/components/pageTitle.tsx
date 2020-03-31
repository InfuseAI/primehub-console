import React from 'react';

type Props = {
  breadcrumb: React.ReactNode;
  title: React.ReactNode;
};

export default class PageTitle extends React.Component<Props> {
  render() {
    const {
      breadcrumb,
      title,
    } = this.props;
    return (
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 24px',
      }}>
        <div style={{
          marginBottom: 24
        }}>
          {breadcrumb}
        </div>
        <h2>{title}</h2>
      </div>
    )
  }
}