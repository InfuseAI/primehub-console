import React from 'react'
import { compose } from 'recompose';
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import { Dashboard } from '@uppy/react'
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { withAccessToken, AccessTokenComponentProps } from 'components/helpers/withAccessToken';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

type Props = AccessTokenComponentProps & GroupContextComponentProps;

const breadcrumbs = [
  {
    key: 'browse',
    matcher: /\/browse/,
    title: 'Share Files',
    link: '/browse'
  }
];

const ShareFilesUploader = (props: Props) => {
  const { accessToken, groupContext } = props;
  const endpoint = `${(window as any).cmsHost}${(window as any).graphqlPrefix}/tus`;
  const dirpath = `groups/${groupContext.name}/upload`;
  const headers = {
    authorization: `Bearer ${accessToken}`
  };
  const uppy = Uppy({
    autoProceed: true
  });

  uppy
    .use(Tus, {
      endpoint,
      headers
    })
    .setMeta({dirpath});

  uppy
    .on('complete', (result) => {
      const url = result.successful[0].uploadURL
      console.log('Upload compelete!', url, result.successful);
    });
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

export default compose(
  withAccessToken,
  withGroupContext
)(ShareFilesUploader);
