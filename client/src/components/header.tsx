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
  deploy: Function;
}

export default class HeaderContainer extends React.Component<Props, {}> {


  headerMenuOnClick = (menuItem: {key: string}) => {
    if(menuItem.key === 'logout') {
      firebase.auth().signOut();
    } else if (menuItem.key === 'deploy') {
      this.props.deploy();
    }
  }

  render() {
    const {
      appUrl,
      deploying,
      hasChanged
    } = this.props;

    const user = JSON.parse(localStorage.getItem("cannerUser")) || {};
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
          <SubMenu title={<span><Avatar src={user.thumb} style={{marginRight: '10px'}}/>Hi, {user.username}</span>}>
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
          {
            hasChanged ? 
            <Menu.Item key="deploy">
            {
              deploying ?
                spinIcon :
                <Badge dot>
                  <MenuText>
                    Save
                  </MenuText>
                </Badge>
            }
            </Menu.Item> :
            <Menu.Item key="saved">
              Saved
            </Menu.Item>
          }
        </Menu>
      </div>
    );
  }
}
