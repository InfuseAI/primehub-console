import React from 'react';
import {Layout, Menu} from 'antd';
import {Link} from 'react-router-dom';
import {appPrefix} from 'utils/env';
import { withRouter, RouteComponentProps } from 'react-router';
import styled from 'styled-components';
import iconHome from 'images/icon-home.svg'
import {get} from 'lodash'
import { MainPageSidebarItem } from 'containers/main';

const Icon = styled.img`
  width: 30px;
  height: 30px;
`;

const Title = styled.span`
  margin-left: 16px;
`;

type Props = RouteComponentProps & {
  sidebarItems: MainPageSidebarItem[]
};

class Sidebar extends React.Component<Props> {
  renderStageBadge(item: MainPageSidebarItem) {
    const badgeStyle =  {
      position: 'absolute',
      top: 28,
      left: 32,
      height: 12,
      borderRadius: 3,
      padding: '6px 2px 2px 2px',
    }

    if (item.stage === 'beta' ) {
      return <sup style={{
        ...badgeStyle,
        backgroundColor: '#52c41a',
      }}>beta</sup>
    } else if (item.stage === 'alpha' ) {
      return <sup style={{
        ...badgeStyle,
        backgroundColor: '#b50606',
      }}>alpha</sup>
    } else {
      return <></>
    }
  }

  render() {
    const {sidebarItems, history, match} = this.props;
    const pathKeyList = ['home', 'hub', 'job', 'schedule', 'model-deployment'];
    let key = '';
    pathKeyList.forEach((val) => {
      if (history.location.pathname.split('/').includes(val)) {
        key = val;
      }
    });
    const group = get(match, 'params.groupName', '');

    return (
      <Layout.Sider style={{paddingTop: 64}}>
        <Menu
          theme="dark"
          selectedKeys={[key]}
        >
          <Menu.Item key="home">
            <Link to={`${appPrefix}g/${group}/home`}>
              <Icon src={iconHome}/>
              <Title>Home</Title>
            </Link>
          </Menu.Item>

          {
            sidebarItems ? sidebarItems.map(item => (
              <Menu.Item key={item.subPath}>
                <Link to={`${appPrefix}g/${group}/${item.subPath}`}>
                  <Icon src={item.icon}/>
                  <Title>{item.title}</Title>
                  {this.renderStageBadge(item)}
                </Link>
              </Menu.Item>
            )) : []
          }
        </Menu>
      </Layout.Sider>
    );
  }
}

export default withRouter(Sidebar);
