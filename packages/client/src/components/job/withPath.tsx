import React from 'react';

const appPrefix = (window as any).APP_PREFIX || '/';

export default function withPath(Com) {
  return class ComWithPath extends React.Component<any> {
    render() {
      const {location} = this.props;
      // 'appPrefix/job/create/'
      const pathname = location.pathname
        .replace(appPrefix, '')
        .replace(/^\//, '')
        .split('/')[0];
      return <Com {...this.props} pathname={pathname} />;
    }
  }
}

export type PathComponentProps = {
  pathname: string;
}