import * as React from 'react';
import {Menu, Layout, Avatar, Select, Form, Tag} from 'antd';
import {LayoutProps} from 'antd/lib/layout';
import styled from 'styled-components';
import logo from 'images/primehub-logo-w.svg';

const { Option } = Select;

const HEADER_HEIGHT = 64;

const Logo = styled.div`
  background-image: url(${logo});
  background-color: #373d62;
  background-size: 65%;
  background-position: 14px 13px;
  background-repeat: no-repeat;
  width: 200px;
  height: ${HEADER_HEIGHT}px;
` as any;
const Header = styled<Props & LayoutProps>(Layout.Header)`
  background: #fff;
  display: flex;
  justify-content: flex-end;
  .ant-menu-item .anticon, .ant-menu-submenu-title .anticon {
    margin: 0;
  }
  height: ${HEADER_HEIGHT}px;
  padding: 0 0;
  border-bottom: 1px solid #dcdcdc;
  position: fixed;
  z-index: 12;
  width: 100%;
` as any;

export interface Props {
  onSelectGroup?: Function;
  pagePadding?: number;
  GroupSelectorCom?: any;
  groupSelectorProps?: any;
}

export default class HeaderContainer extends React.Component<Props, {}> {
  onClickMenu = (item: any) => {
    const links = (window as any).links || {
      userProfileLink: '',
      changePasswordLink: '',
      apiTokenLink: '/api-token',
      adminPortalLink: '/cms',
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
      case 'adminPortal': {
        (window as any).location.href = links.adminPortalLink;
        break;
      }
      case 'logout': {
        (window as any).location.href = links.logoutLink;
      }
    }
  }

  render() {
    const {pagePadding, GroupSelectorCom, groupSelectorProps} = this.props;
    const thumbnail = (window as any).thumbnail;
    const isUserAdmin = (window as any).isUserAdmin;
    return (
      <Header pagePadding={pagePadding}>
        <a href="/" style={{display: "flex", marginRight: "auto", position: "relative"}}>
          <Logo />
        </a>
        {
          GroupSelectorCom ? (
            <GroupSelectorCom {...groupSelectorProps} />
          ) : (
            <span/>
          )
        }
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
            <Menu.Item key="adminPortal" style={{display: isUserAdmin? undefined : 'none'}}>
              Admin Portal
            </Menu.Item>
            <Menu.Item key="logout" style={{borderTop: '1px solid #f1f1f1'}}>
              Logout
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key="phVersion" disabled={ true } style={{
                fontSize: '12px',
                height: '20px',
                marginTop: 0,
                lineHeight: '20px',
                cursor: 'default',
                color: '#999 !important'
            }}>
              version: {(window as any).primehubVersion}
            </Menu.Item>
          </Menu.SubMenu>
        </Menu>
      </Header>
    );
  }
}
