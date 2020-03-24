import React from 'react';
import {appPrefix} from 'utils/env';

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