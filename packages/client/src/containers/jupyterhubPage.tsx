import * as React from 'react';
import {compose} from 'recompose';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import IFrame from 'components/hub/iframe';
import PageTitle from 'components/pageTitle';
import Log from 'components/share/log';
import PageBody from 'components/pageBody';
import { Breadcrumb, Icon, Tabs } from 'antd';
import { Link, RouteComponentProps } from 'react-router-dom';
import { appPrefix } from 'utils/env';
import { withRouter } from 'react-router';

type Props = GroupContextComponentProps & RouteComponentProps;

class JupyterhubContainer extends React.Component<Props> {
  renderBreadCrumb () {
    const { match } = this.props;
    const params = match.params as any
    const basename = params.groupName ? `${appPrefix}g/${params.groupName}` : `${appPrefix}`;

    return (
      <Breadcrumb style={{marginBottom: 8}}>
        <Breadcrumb.Item key="home">
          {
          params.groupName ?
          <Link to={`${basename}`}><Icon type="home" /></Link> :
          <a href={`${basename}`}><Icon type="home" /></a>
          }
        </Breadcrumb.Item>
        <Breadcrumb.Item key="notebook">Notebooks</Breadcrumb.Item>
      </Breadcrumb>
    );
  }

  render() {
    const {groupContext} = this.props;

    return (
      <>
        <PageTitle
          breadcrumb={this.renderBreadCrumb()}
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
                retryAfterTemintated={true}
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
