import React from 'react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import { Dashboard } from '@uppy/react'
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import { getAccessToken } from 'utils/env';

interface Props {
  dirPath: String
};

export default (props: Props) => {
  const { dirPath } = props;
  let graphqlEndpoint = ((window as any).absGraphqlEndpoint) ?
    ((window as any).absGraphqlEndpoint) :
    ((window as any).graphqlEndpoint);
  const endpoint = graphqlEndpoint.replace('/graphql', '/tus')

  const headers = {
    authorization: `Bearer ${getAccessToken()}`
  };
  const uppy = Uppy({
    autoProceed: true
  });

  uppy
    .use(Tus, {
      endpoint,
      headers
    })
    .setMeta({dirpath: dirPath});
  uppy
    .on('complete', (result) => {
      const url = result.successful[0].uploadURL
      console.log('Upload compelete!', url, result.successful);
    });
  return (
    <Dashboard
      inline={true}
      width={850}
      uppy={uppy}
    />
  )
}
