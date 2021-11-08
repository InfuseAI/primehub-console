import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';

import Browser from 'components/Browser/Browser';
import { useRoutePrefix } from 'hooks/useRoutePrefix';

function DatasetBrowser() {
  const { dataset, path, groupName } =
    useParams<{ groupName: string; path: string; dataset: string }>();
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
    history.push(`${appPrefix}g/${groupName}/datasets/${dataset}${path}`);
  };

  return (
    <>
      <PageTitle
        title='Datasets'
        breadcrumb={
          <Breadcrumbs
            pathList={[
              {
                key: 'browse',
                matcher: /.*/,
                title: 'Datasets',
                link: '/browse',
                tips: '',
                tipsLink: '#',
              },
            ]}
          />
        }
      />
      <PageBody>
        <Browser
          title={dataset}
          basePath={`datasets/${dataset}`}
          path={path || '/'}
          enabledPHFS={enabledPHFS}
          onChange={handleChangePath}
        />
      </PageBody>
    </>
  );
}

export default DatasetBrowser;
