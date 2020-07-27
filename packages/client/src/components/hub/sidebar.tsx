import React from 'react';
import {Layout, Menu} from 'antd';
import {Link} from 'react-router-dom';
import {appPrefix} from 'utils/env';
import { withRouter, RouteComponentProps } from 'react-router';

type Props = RouteComponentProps & {};
class Sidebar extends React.Component<Props> {
  render() {
    const {history} = this.props;
    const key = history.location.pathname.split('/').includes('job') ? "job" : "schedule";
    return (
      <Layout.Sider style={{paddingTop: 64}}>
        <Menu
          theme="dark"
          selectedKeys={[key]}
        >
          <Menu.Item key="JupyterHub">
            <Link to={`${appPrefix}hub/home`}>
              JupyterHub
            </Link>
          </Menu.Item>
          <Menu.Item key="JupyterHubAdmin">
            <Link to={`${appPrefix}hub/admin`}>
              JupyterHub Admin
            </Link>
          </Menu.Item>
        </Menu>
      </Layout.Sider>
    );
  }
}

export default withRouter(Sidebar);
