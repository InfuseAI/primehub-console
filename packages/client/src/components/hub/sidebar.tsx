import React from 'react';
import {Layout, Menu} from 'antd';
import {Link} from 'react-router-dom';
import {appPrefix} from 'utils/env';
import { withRouter, RouteComponentProps } from 'react-router';

type Props = RouteComponentProps & {};
class Sidebar extends React.Component<Props> {
  render() {
    const {history} = this.props;
    const pathKeyList = ['home', 'hub', 'job', 'schedule', 'model-deployment'];
    let key = '';
    pathKeyList.forEach((val) => {
      if (history.location.pathname.split('/').includes(val)) {
        key = val;
      }
    });

    return (
      <Layout.Sider style={{paddingTop: 64}}>
        <Menu
          theme="dark"
          selectedKeys={[key]}
        >
          <Menu.Item key="home">
            <Link to={`${appPrefix}console/g/default/home`}>
              Home
            </Link>
          </Menu.Item>
          <Menu.Item key="hub">
            <Link to={`${appPrefix}console/g/default/hub`}>
              JupyterHub
            </Link>
          </Menu.Item>
          {
          //<Menu.Item key="job">
            //<Link to={`${appPrefix}job`}>
              //Job
            //</Link>
          //</Menu.Item>
          //<Menu.Item key="schedule">
            //<Link to={`${appPrefix}schedule`}>
              //Schedule
            //</Link>
          //</Menu.Item>
          //<Menu.Item key="model-deployment">
            //<Link to={`${appPrefix}model-deployment`}>
              //Model Deployment
            //</Link>
          //</Menu.Item>
          }
        </Menu>
      </Layout.Sider>
    );
  }
}

export default withRouter(Sidebar);
