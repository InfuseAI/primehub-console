import React, { useState, useEffect, useContext, useMemo } from 'react';
import styled from 'styled-components';
import { Layout, Menu, Divider } from 'antd';
import { Link, useParams, useLocation } from 'react-router-dom';
import ProModal from 'components/share/ProModal';
import { UserContext } from 'context/user';
import { Badge } from 'components/share/utils';
import {
  SidebarList,
  SidebarPathList,
  PATH_KEY_LIST,
} from 'components/Sidebar/types';
import { useRoutePrefix } from 'hooks/useRoutePrefix';

const MenuIcon = styled.img`
  width: 25px;
  height: 25px;
`;

const Title = styled.span`
  margin-left: 16px;
`;

interface Props {
  sidebarItems: SidebarList;
}

const STATUS_BADGE = {
  beta: <Badge>beta</Badge>,
  alpha: <Badge>alpha</Badge>,
  pro: <Badge>pro</Badge>,
};

export function Sidebar({ sidebarItems }: Props) {
  const [path, setPath] = useState<SidebarPathList>('home');
  const [modal, setModal] = useState(false);
  const [enableApp, setEnableApp] = useState(false);
  const currentUser = useContext(UserContext);

  const location = useLocation();
  const { appPrefix } = useRoutePrefix();
  const { groupName } = useParams<{ groupName: string }>();
  const { userItems, adminItems, hasAdminItems } = useMemo(() => {
    const filterSidebarItems = sidebarItems.filter(item => {
      if (item.title === 'Apps' && !enableApp) {
        return false;
      }
      return true;
    });

    const user = filterSidebarItems.filter(item => !item?.groupAdminOnly);
    const admin = filterSidebarItems.filter(
      item =>
        (currentUser?.isCurrentGroupAdmin || window.isUserAdmin) &&
        item?.groupAdminOnly
    );
    const hasAdmin = admin.length > 0;

    return {
      userItems: user,
      adminItems: admin,
      hasAdminItems: hasAdmin,
    };
  }, [currentUser?.isCurrentGroupAdmin, sidebarItems, enableApp]);

  useEffect(() => {
    // Split by `/g/` => [prefix, routes]
    const routes = location.pathname.split('/g/')[1];

    // Get parent path
    const currentPath = routes.split('/')[1] as typeof PATH_KEY_LIST[number];

    if (PATH_KEY_LIST.includes(currentPath)) {
      setPath(currentPath);
    }
  }, [location]);

  useEffect(() => {
    if (window?.enableApp) {
      setEnableApp(true);
    }
  }, []);

  const renderMenuItem = item => {
    return (
      <Menu.Item
        key={item.subPath}
        style={{ paddingLeft: 26 }}
        data-testid={item.subPath}
        onClick={
          item.proFeature ? () => setModal(true) : () => setPath(item.subPath)
        }
      >
        {item.proFeature ? (
          <span>
            <MenuIcon src={item.icon} style={item.style} />
            <Title>{item.title}</Title>
            {STATUS_BADGE.pro}
          </span>
        ) : (
          <Link to={`${appPrefix}g/${groupName}/${item.subPath}`}>
            <MenuIcon src={item.icon} style={item.style} />
            <Title>{item.title}</Title>
            {STATUS_BADGE[item.stage]}
          </Link>
        )}
      </Menu.Item>
    );
  };

  const closeModal = () => {
    setModal(false);
  };

  return (
    <Layout.Sider style={{ position: 'fixed', height: '100%' }}>
      <Menu theme='dark' selectedKeys={[path]} data-testid={`${path}-active`}>
        {userItems.map(renderMenuItem)}
        {hasAdminItems && (
          <Divider
            style={{
              marginTop: 5,
              marginBottom: 5,
              backgroundColor: '#555666',
            }}
          />
        )}

        {hasAdminItems && adminItems.map(renderMenuItem)}
      </Menu>
      <ProModal visible={modal} onOk={closeModal} onCancel={closeModal} />
    </Layout.Sider>
  );
}
