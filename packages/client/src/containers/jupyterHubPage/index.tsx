import * as React from 'react';
import { Tabs } from 'antd';
import { RouteComponentProps } from 'react-router-dom';
import { compose } from 'recompose';
import { withRouter } from 'react-router';

import PageTitle from 'components/pageTitle';
import Log from 'components/share/log';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { IFrame } from 'components/hub/iframe';
import { withGroupContext, GroupContextComponentProps } from 'context/group';

type Props = GroupContextComponentProps & RouteComponentProps;

export function JupyterHubContainer({ groupContext }: Props) {
  const breadcrumbs = [
    {
      key: 'hub',
      matcher: /\/hub/,
      title: 'Notebooks',
      tips: 'Users can launch a Jupyter Notebook instance here.',
      tipsLink: 'https://docs.primehub.io/docs/quickstart/launch-project',
    },
  ];

  return (
    <>
      <PageTitle breadcrumb={<Breadcrumbs pathList={breadcrumbs} />} />

      <PageBody style={{ flex: '1 1 0%' }}>
        <Tabs style={{ height: '100%' }}>
          <Tabs.TabPane key="information" tab="Notebooks">
            <div style={{ height: 'calc(100vh - 310px)' }}>
              <IFrame src={`/hub/primehub/home?group=${groupContext.name}`} />
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane key="logs" tab="Logs">
            <Log endpoint="/api/logs/jupyterhub" retryAfterTermintated={true} />
          </Tabs.TabPane>
        </Tabs>
      </PageBody>
    </>
  );
}

export default compose(withGroupContext, withRouter)(JupyterHubContainer);
