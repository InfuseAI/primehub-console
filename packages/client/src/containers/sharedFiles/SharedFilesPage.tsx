import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';

import Browser from 'components/Browser/Browser';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import InfuseButton from 'components/infuseButton';

function ShareFilesPage() {
  const { groupName, phfsPrefix } =
    useParams<{ groupName: string; phfsPrefix: string }>();
  const [enabledPHFS, setEndabledPHFS] = useState(false);
  const { appPrefix } = useRoutePrefix();
  const history = useHistory();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (typeof window === undefined) return;

    if (window?.enablePhfs) {
      setEndabledPHFS(true);
    }
  }, []);

  const handlePathChange = path => {
    history.push(`${appPrefix}g/${groupName}/browse${path}`);
  };

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            marginBottom: 16,
          }}
        >
          <InfuseButton
            icon='upload'
            type='primary'
            style={{ marginLeft: 16 }}
            onClick={() => {
              setUploading(true);
            }}
          >
            Upload Files
          </InfuseButton>
        </div>
        <Browser
          title={groupName}
          basePath=''
          path={phfsPrefix || '/'}
          enabledPHFS={enabledPHFS}
          onPathChange={handlePathChange}
          uploading={uploading}
          onUploadingChange={uploading => setUploading(uploading)}
        />
      </PageBody>
    </>
  );
}

export default ShareFilesPage;
