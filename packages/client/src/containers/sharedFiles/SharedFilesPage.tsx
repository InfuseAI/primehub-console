import React from 'react';
import { useParams } from 'react-router-dom';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';

import BrowseSharedFiles from './BrowseSharedFiles';

function ShareFilesPage() {
  const params = useParams<{ groupName: string; phfsPrefix: string }>();

  return (
    <>
      <PageTitle
        title='Shared Files'
        breadcrumb={
          <Breadcrumbs
            pathList={[
              {
                key: 'browse',
                matcher: /\/browse/,
                title: 'Shared Files',
                link: '/browse',
                tips: 'Users can share files in this PHFS storage with group members.',
                tipsLink: 'https://docs.primehub.io/docs/shared-files',
              },
            ]}
          />
        }
      />
      <PageBody>
        <BrowseSharedFiles path={params?.phfsPrefix || ''} />
      </PageBody>
    </>
  );
}

export default ShareFilesPage;
