import React from 'react';
import {Layout, Menu, Divider} from 'antd';
import {Link} from 'react-router-dom';
import {appPrefix} from 'utils/env';
import { withRouter, RouteComponentProps } from 'react-router';
import styled from 'styled-components';
import iconHome from 'images/icon-home.svg';
import {get} from 'lodash';
import { MainPageSidebarItem } from 'containers/mainPage';
import {compose} from 'recompose';
import { withUserContext, UserContextComponentProps } from 'context/user';

const Icon = styled.img`
  width: 25px;
  height: 25px;
`;

const Title = styled.span`
  margin-left: 16px;
`;

const Badge = styled.span`
  position: absolute;
  top: 12px;
  left: 140px;
  border-radius: 2px;
  padding: 0px 5px;
  line-height: 15px;
  background: none;
  border: 1px rgb(255,255,255, 0.5) solid;
  font-size: 10px;

  .ant-menu-item:hover &, .ant-menu-item-selected & {
    border-color: #fff;
  }
`;

type Props = UserContextComponentProps & RouteComponentProps & {
  sidebarItems: MainPageSidebarItem[]
};

class Sidebar extends React.Component<Props> {
  renderSidebarItem(item: MainPageSidebarItem, group: string) {
    return (
      <Menu.Item key={item.subPath} style={{paddingLeft: 26}}>
        <Link to={`${appPrefix}g/${group}/${item.subPath}`}>
          <Icon src={item.icon} style={item.style}/>
          <Title>{item.title}</Title>
          {this.renderStageBadge(item)}
        </Link>
      </Menu.Item>
      );
  }

  renderSidebarItems(items: MainPageSidebarItem[], group: string) {
    const sidebarItems = [];
    const userItems = items.filter(item => !item.groupAdminOnly);
    const adminItems = items.filter(item => item.groupAdminOnly && item.groupAdminOnly === true);

    sidebarItems.push(userItems.map(item => this.renderSidebarItem(item, group)));
    if (adminItems.length > 0) {
      sidebarItems.push(
        <Menu.Item style={{margin: 0, height: 10}}>
          <Divider style={{marginTop: 5, marginBottom: 5, backgroundColor: '#555666'}}/>
        </Menu.Item>
      );
      sidebarItems.push(adminItems.map(item => this.renderSidebarItem(item, group)));
    }

    return sidebarItems;
  }

  renderStageBadge(item: MainPageSidebarItem) {

    if (item.stage === 'beta') {
      return <Badge>beta</Badge>;
    } else if (item.stage === 'alpha') {
      return <Badge>alpha</Badge>;
    } else {
      return <></>;
    }
  }

  render() {
    const { history, match, userContext} = this.props;
    const pathKeyList = ['home', 'hub', 'job', 'schedule', 'model-deployment', 'browse', 'images'];
    let key = '';
    pathKeyList.forEach(val => {
      if (history.location.pathname.split('/').includes(val)) {
        key = val;
      }
    });
    const group = get(match, 'params.groupName', '');

    const sidebarItems = this.props.sidebarItems.filter(item => {
      if (item.groupAdminOnly) {
        return get(userContext, 'isCurrentGroupAdmin', false);
      }
      return true;
    });

    return (
      <Layout.Sider style={{position: 'fixed', height: '100%'}}>
        <Menu
          theme='dark'
          selectedKeys={[key]}
        >
          <Menu.Item key='home' style={{marginTop: 0, paddingLeft: 26}}>
            <Link to={group ? `${appPrefix}g/${group}/home` : `${appPrefix}g`}>
              <Icon src={iconHome} style={{width: 'auto', height: 16, marginTop: '-4px'}}/>
              <Title>Home</Title>
            </Link>
          </Menu.Item>

          {group &&
            sidebarItems ? this.renderSidebarItems(sidebarItems, group) : []
          }
        </Menu>
      </Layout.Sider>
    );
  }
}

export default compose(
  withRouter,
  withUserContext
)(Sidebar);
