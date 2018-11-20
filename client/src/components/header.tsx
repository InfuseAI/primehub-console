import * as React from 'react';
import {Menu, Icon, Badge, Avatar} from 'antd';
import styled from 'styled-components';
import firebase from 'firebase';
const SubMenu = Menu.SubMenu;

const ItemContent = styled.div`
  a {
    color: #FFF !important;
  }

  .ant-badge {
    color: #FFF;
  }
`

const MenuText = styled.span`
  color: rgba(255, 255, 255, .65);
  &:hover {
    color: #fff;
  }
`;

export interface Props {
  appUrl: any;
  deploying: boolean;
  hasChanged: boolean;
  subMenuTitle: any;
}

export default class HeaderContainer extends React.Component<Props, {}> {


  headerMenuOnClick = (menuItem: {key: string}) => {
    if(menuItem.key === 'logout') {
      // firebase.auth().signOut();
      location.href = `${(window as any).APP_PREFIX}oidc/logout`;
    }
  }

  render() {
    const {
      appUrl,
      deploying,
      hasChanged,
      subMenuTitle
    } = this.props;

    const spinIcon = <Icon type="loading" style={{ fontSize: 24 }} spin />;
    
    return (
      <div style={{float: "right"}}>
        <Menu
          theme="dark"
          mode="horizontal"
          style={{ lineHeight: '64px', width: '100%' }}
          onClick={this.headerMenuOnClick}
          selectedKeys={[]}
          >
          <SubMenu title={subMenuTitle}>
            <Menu.Item theme="light" key="logout">
              <ItemContent>
                <Icon type="poweroff" /> Logout
              </ItemContent>
            </Menu.Item>
          </SubMenu>
          {/* <Menu.Item>
            <ItemContent>
              <a href={`https://www.canner.io/home/apps/${appUrl}/overview`}>
                <Icon type="home" />
                Dashboard
              </a>
            </ItemContent>
          </Menu.Item> */}
        </Menu>
      </div>
    );
  }
}
