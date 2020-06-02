import * as React from 'react';
import {Menu, Layout, Avatar} from 'antd';
import {LayoutProps} from 'antd/lib/layout';
import styled from 'styled-components';
import logo from 'images/primehub-logo.svg';

const HEADER_HEIGHT = 64;
const PAGE_PADDING = 64;

const Logo = styled.div`
  background-image: url(${logo});
  background-size: contain;
  background-position: left;
  background-repeat: no-repeat;
  width: 200px;
  margin: 8px 0;
` as any;
const Header = styled<Props & LayoutProps>(Layout.Header)`
  background: #fff;
  display: flex;
  justify-content: space-between;
  .ant-menu-item .anticon, .ant-menu-submenu-title .anticon {
    margin: 0;
  }
  height: ${HEADER_HEIGHT}px;
  padding: 0 ${props => props.pagePadding ? props.pagePadding : PAGE_PADDING}px;
  border-bottom: 1px solid #dcdcdc;
  position: fixed;
  z-index: 12;
  width: 100%;
` as any;

export interface Props {
  pagePadding?: number;
}

export default class HeaderContainer extends React.Component<Props, {}> {
  onClickMenu = (item: any) => {
    const links = (window as any).links || {
      userProfileLink: '',
      changePasswordLink: '',
      apiTokenLink: '/api-token',
      logoutLink: '',
    }
    switch (item.key) {
      case 'userProfile': {
        (window as any).location.href = links.userProfileLink;
        break;
      }
      case 'changePassword': {
        (window as any).location.href = links.changePasswordLink;
        break;
      }
      case 'apiToken': {
        (window as any).location.href = links.apiTokenLink;
        break;
      }
      case 'logout': {
        (window as any).location.href = links.logoutLink;
      }
    }
  }

  render() {
    const {pagePadding} = this.props;
    const thumbnail = (window as any).thumbnail;
    return (
      <Header pagePadding={pagePadding}>
        <a href="/" style={{display: "flex"}}>
          <Logo />
        </a>
        <Menu
          onClick={this.onClickMenu}
          theme="light"
          mode="horizontal"
          style={{ lineHeight: '64px', border: 0}}
        >
          <Menu.SubMenu
            title={<Avatar src={thumbnail} icon="user"/>}
          >
            <Menu.Item key="userProfile">
              User Profile
            </Menu.Item>
            <Menu.Item key="changePassword">
              Change Password
            </Menu.Item>
            <Menu.Item key="apiToken">
              API Token
            </Menu.Item>
            <Menu.Item key="logout" style={{borderTop: '1px solid #f1f1f1'}}>
              Logout
            </Menu.Item>
          </Menu.SubMenu>
        </Menu>
      </Header>
    );
  }
}
