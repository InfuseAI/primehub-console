import * as React from 'react';
import {compose} from 'recompose';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import IFrame from 'components/hub/iframe';
import PageTitle from 'components/pageTitle';
import Log from 'components/share/log';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { Icon, Tabs } from 'antd';
import { Link, RouteComponentProps } from 'react-router-dom';
import { appPrefix } from 'utils/env';
import { withRouter } from 'react-router';

type Props = GroupContextComponentProps & RouteComponentProps;

const breadcrumbs = [
  {
    key: 'hub',
    matcher: /\/hub/,
    title: 'Notebooks'
  }
];

class JupyterhubContainer extends React.Component<Props> {
  render() {
    const {groupContext} = this.props;

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={"Notebooks"}
        />
        <PageBody style={{flex: '1 1 0%'}}>
          <Tabs style={{height: '100%'}}>
            <Tabs.TabPane key="information" tab="Notebooks">
              <div style={{height: 'calc(100vh - 310px)'}}>
                <IFrame src={`/hub/primehub/home?group=${groupContext.name}`}/>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane
              key="logs"
              tab="Logs"
            >
              <Log
                endpoint='/api/logs/jupyterhub'
                retryAfterTermintated={true}
              />
            </Tabs.TabPane>
          </Tabs>
        </PageBody>
      </>
    );
  }
}

export default compose(
  withGroupContext,
  withRouter
)(JupyterhubContainer)
