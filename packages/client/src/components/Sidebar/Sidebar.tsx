import * as React from 'react';
import styled from 'styled-components';
import { Layout, Menu, Divider } from 'antd';
import { Link, useParams } from 'react-router-dom';

import { appPrefix } from 'utils/env';
import { UserContext } from 'context/user';
import { SidebarList, SidebarPathList } from 'components/Sidebar/constants';

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
  border: 1px rgb(255, 255, 255, 0.5) solid;
  font-size: 10px;

  .ant-menu-item:hover &,
  .ant-menu-item-selected & {
    border-color: #fff;
  }
`;

interface Props {
  sidebarItems: SidebarList;
}

const STATUS_BADGE = {
  beta: <Badge>beta</Badge>,
  alpha: <Badge>alpha</Badge>,
};

export function Sidebar({ sidebarItems }: Props) {
  const [key, setKey] = React.useState<SidebarPathList>('home');
  const [enableApp, setEnableApp] = React.useState(false);
  const currentUser = React.useContext(UserContext);

  const { groupName } = useParams<{ groupName: string }>();
  const { userItems, adminItems, hasAdminItems } = React.useMemo(() => {
    const filterSidebarItems = sidebarItems.filter((item) => {
      if (item?.flag && !enableApp) {
        return false;
      }
      return true;
    });

    const user = filterSidebarItems.filter((item) => !item?.groupAdminOnly);
    const admin = filterSidebarItems.filter(
      (item) => currentUser?.isCurrentGroupAdmin && item?.groupAdminOnly
    );
    const hasAdminItems = admin.length > 0;

    return {
      userItems: user,
      adminItems: admin,
      hasAdminItems,
    };
  }, [currentUser, sidebarItems, enableApp]);

  React.useEffect(() => {
    if ((window as any)?.enableApp) {
      setEnableApp(true);
    }
  }, []);

  return (
    <Layout.Sider style={{ position: 'fixed', height: '100%' }}>
      <Menu theme="dark" selectedKeys={[key]} data-testid={`${key}-active`}>
        {userItems.map((item) => (
          <Menu.Item
            key={item.subPath}
            style={{ paddingLeft: 26 }}
            data-testid={`${item.subPath}`}
            onClick={() => setKey(item.subPath)}
          >
            <Link to={`${appPrefix}g/${groupName}/${item.subPath}`}>
              <Icon src={item.icon} style={item.style} />
              <Title>{item.title}</Title>
              {STATUS_BADGE[item.stage]}
            </Link>
          </Menu.Item>
        ))}

        {hasAdminItems && (
          <Divider
            style={{
              marginTop: 5,
              marginBottom: 5,
              backgroundColor: '#555666',
            }}
          />
        )}

        {hasAdminItems &&
          adminItems.map((item) => (
            <Menu.Item key={item.subPath} style={{ paddingLeft: 26 }}>
              <Link to={`${appPrefix}g/${groupName}/${item.subPath}`}>
                <Icon src={item.icon} style={item.style} />
                <Title>{item.title}</Title>
                {STATUS_BADGE[item.stage]}
              </Link>
            </Menu.Item>
          ))}
      </Menu>
    </Layout.Sider>
  );
}
