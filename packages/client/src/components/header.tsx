import * as React from 'react';
import { Menu, Layout, Avatar, Select, Form, Tag } from 'antd';
import { LayoutProps } from 'antd/lib/layout';
import styled from 'styled-components';
import logo from 'images/primehub-logo-w.svg';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import { appPrefix } from 'utils/env';

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
  .ant-menu-item .anticon,
  .ant-menu-submenu-title .anticon {
    margin: 0;
  }
  height: ${HEADER_HEIGHT}px;
  padding: 0 0;
  border-bottom: 1px solid #dcdcdc;
  position: fixed;
  z-index: 12;
  width: 100%;
` as any;

export interface Props extends GroupContextComponentProps {
  onSelectGroup?: Function;
  GroupSelectorCom?: any;
  groupSelectorProps?: any;
}

class HeaderContainer extends React.Component<Props, {}> {
  onClickMenu = (item: any) => {
    const isGlobalLinksExist = (window as any).links;
    const links =
      isGlobalLinksExist && typeof isGlobalLinksExist === 'string'
        ? JSON.parse(isGlobalLinksExist)
        : {
            userProfileLink: '',
            changePasswordLink: '',
            apiTokenLink: '/api-token',
            adminPortalLink: '/admin',
            logoutLink: '',
          };

    switch (item.key) {
      case 'userProfile': {
        window.location.href = links.userProfileLink;
        break;
      }
      case 'changePassword': {
        window.location.href = links.changePasswordLink;
        break;
      }
      case 'apiToken': {
        const { groupContext } = this.props;
        const link = `${appPrefix}g/${groupContext.name}/api-token`;
        window.location.href = link;
        break;
      }
      case 'adminPortal': {
        window.location.href = links.adminPortalLink;
        break;
      }
      case 'logout': {
        window.location.href = links.logoutLink;
      }
    }
  };

  render() {
    const { groupContext, GroupSelectorCom, groupSelectorProps } = this.props;
    const thumbnail = window.thumbnail;
    const isUserAdmin = window.isUserAdmin;
    return (
      <Header>
        <a
          href='/'
          style={{ display: 'flex', marginRight: 'auto', position: 'relative' }}
        >
          <Logo />
        </a>
        {GroupSelectorCom ? (
          <GroupSelectorCom {...groupSelectorProps} />
        ) : (
          <span />
        )}
        <Menu
          onClick={this.onClickMenu}
          theme='light'
          mode='horizontal'
          style={{ lineHeight: '64px', border: 0 }}
        >
          <Menu.SubMenu title={<Avatar src={thumbnail} icon='user' />}>
            <Menu.Item key='userProfile'>User Profile</Menu.Item>
            <Menu.Item key='changePassword'>Change Password</Menu.Item>
            {groupContext ? (
              <Menu.Item key='apiToken'>API Token</Menu.Item>
            ) : (
              <></>
            )}
            <Menu.Item
              key='adminPortal'
              style={{ display: isUserAdmin ? undefined : 'none' }}
            >
              Admin Portal
            </Menu.Item>
            <Menu.Item key='logout' style={{ borderTop: '1px solid #f1f1f1' }}>
              Logout
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              key='phVersion'
              disabled={true}
              style={{
                fontSize: '12px',
                height: '20px',
                marginTop: 0,
                lineHeight: '20px',
                cursor: 'default',
                color: '#999 !important',
              }}
            >
              version: {window.primehubVersion}
            </Menu.Item>
          </Menu.SubMenu>
        </Menu>
      </Header>
    );
  }
}

export default withGroupContext(HeaderContainer);
