import React from 'react';

type Props = {
  title: React.ReactNode;
  extra: React.ReactNode;
};

export default class PageTitle extends React.Component<Props> {
  render() {
    const {
      title,
      extra,
    } = this.props;
    return (
      <div style={{
        marginBottom: '48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}>
        <h1 style={{margin: 0}}>{title}</h1>
        {extra}
      </div>
    )
  }
}