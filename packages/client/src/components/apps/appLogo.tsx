import React from 'react';
import defaultLogo from 'images/icon-apps.svg';
import styled from 'styled-components';

export const SpanLogo = styled.span`
  display: inline-block;
  height: 64px;
  width: 64px;
  line-height: 52px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 9px;
  img {
    width: 54px !important;
  }
`;

interface Props {
  src: string;
  style?: any;
}

class AppLogo extends React.Component<Props> {
  onError(e) {
    e.currentTarget.src = defaultLogo;
    e.currentTarget.closest('span').style.backgroundColor = 'rgb(215 222 242)';
  }
  render() {
    let { src } = this.props;
    const { style } = this.props;
    src = src && src.length > 0 ? src : defaultLogo;
    return (
      <SpanLogo
        style={{
          backgroundColor: src === defaultLogo ? 'rgb(215 222 242)' : null,
          ...style,
        }}
      >
        <img src={src} onError={this.onError} />
      </SpanLogo>
    );
  }
}

export default AppLogo;
