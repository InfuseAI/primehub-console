import React from 'react';

export default function withPath(Com) {
  return class ComWithPath extends React.Component<any> {
    render() {
      const {location} = this.props;
      // '/job/create/'
      const pathname = location.pathname.split('/')[1];
      return <Com {...this.props} pathname={pathname} />;
    }
  }
}

export type PathComponentProps = {
  pathname: string;
}