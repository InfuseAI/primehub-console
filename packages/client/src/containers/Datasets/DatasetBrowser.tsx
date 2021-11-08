import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';

import Browser from 'components/Browser/Browser';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { Tabs } from 'antd';
import InfuseButton from 'components/infuseButton';

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

  const [tabKey, setTabKey] = useState('data');
  const [uploading, setUploading] = useState(false);

  const handleChangePath = path => {
    history.push(`${appPrefix}g/${groupName}/datasets/${dataset}${path}`);
  };

  const uploadButton = (
    <InfuseButton
      icon='upload'
      type='primary'
      style={{ marginLeft: 16 }}
      onClick={() => {
        setUploading(true);
      }}>
      Upload Files
    </InfuseButton>);

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
        <Tabs
          animated={false}
          tabBarExtraContent={tabKey === 'data' ? uploadButton : undefined}
          onChange={key => setTabKey(key)}
        >
          <Tabs.TabPane tab='Data' key='data'>
            <Browser
              title={dataset}
              basePath={`datasets/${dataset}`}
              path={path || '/'}
              enabledPHFS={enabledPHFS}
              onChange={handleChangePath}
              uploading={uploading}
              onUploadingChange={uploading => {
                setUploading(uploading);
              }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab='Information' key='information'>
            Datasets information
          </Tabs.TabPane>
        </Tabs>
      </PageBody>
    </>
  );
}

export default DatasetBrowser;
