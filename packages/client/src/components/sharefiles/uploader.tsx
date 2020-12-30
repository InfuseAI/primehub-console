import React from 'react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { Dashboard } from '@uppy/react'

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css'

const uppy = Uppy({
  meta: { type: 'avatar' },
  restrictions: { maxNumberOfFiles: 1 },
  autoProceed: true
});

uppy.use(Tus, { endpoint: '/upload' })

uppy.on('complete', (result) => {
  const url = result.successful[0].uploadURL
})

const breadcrumbs = [
  {
    key: 'browse',
    matcher: /\/browse/,
    title: 'Share Files',
    link: '/browse'
  }
];

const ShareFilesUploader = () => {
  return (
    <div>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={"Share Files"}
      />
      <PageBody>
        <div style={
          {
            width: "70%",
            margin: "auto"
          }
        }
        >
          <Dashboard
            uppy={uppy}
          />
        </div>
      </PageBody>
    </div>
  )
}

export default ShareFilesUploader;
