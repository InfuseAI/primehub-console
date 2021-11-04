import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';

import { Browser } from 'components/Browser/Browser';
import { useRoutePrefix } from 'hooks/useRoutePrefix';

function ShareFilesPage() {
  const { groupName, phfsPrefix } =
    useParams<{ groupName: string; phfsPrefix: string }>();
  const [enabledPHFS, setEndabledPHFS] = useState(false);
  const { appPrefix } = useRoutePrefix();
  const history = useHistory();

  useEffect(() => {
    if (typeof window === undefined) return;

    if (window?.enablePhfs) {
      setEndabledPHFS(true);
    }
  }, []);

  const handleChangePath = path => {
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
        <Browser
          title={groupName}
          basePath=''
          path={phfsPrefix || '/'}
          enabledPHFS={enabledPHFS}
          onChange={handleChangePath}
        />
      </PageBody>
    </>
  );
}

export default ShareFilesPage;
