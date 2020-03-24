import React from 'react';
import {Layout, Menu} from 'antd';
import {appPrefix} from 'utils/env';

type Props = {
  defaultKey: string
};

export default class Sidebar extends React.Component<Props> {
  render() {
    const {defaultKey} = this.props;
    return (
      <Layout.Sider style={{paddingTop: 64}}>
        <Menu
          theme="dark"
          defaultSelectedKeys={[defaultKey]}
        >
          <Menu.Item key="job">
            <a href={`${appPrefix}job`}>
              Jobs
            </a>
          </Menu.Item>
          <Menu.Item key="schedule">
            <a href={`${appPrefix}schedule`}>
              Schedules
            </a>
          </Menu.Item>
        </Menu>
      </Layout.Sider>
    );
  }
}