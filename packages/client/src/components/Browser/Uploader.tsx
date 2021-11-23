import React, { useState } from 'react';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { Dashboard } from '@uppy/react';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import { getAccessToken } from 'utils/env';

interface Props {
  dirPath: string;
  onFileUpload?: () => void;
}

export default function Uploader(props: Props) {
  const { dirPath, onFileUpload } = props;
  const graphqlEndpoint = window.absGraphqlEndpoint
    ? window.absGraphqlEndpoint
    : window.graphqlEndpoint;
  const endpoint = graphqlEndpoint.replace('/graphql', '/tus');

  const headers = {
    authorization: `Bearer ${getAccessToken()}`,
  };

  function createUppy() {
    const uppy = Uppy({ autoProceed: true });
    uppy
      .use(Tus, {
        endpoint,
        headers,
      })
      .setMeta({ dirpath: dirPath });
    uppy.on('upload-success', () => {
      if (onFileUpload) {
        onFileUpload();
      }
    });
    return uppy;
  }
  const [uppy] = useState(createUppy());

  return <Dashboard width={850} uppy={uppy} />;
}
