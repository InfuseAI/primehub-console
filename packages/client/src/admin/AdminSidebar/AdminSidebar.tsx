import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Icon } from 'antd';
import { Badge } from 'components/share/utils';
import ExternalLinkIcon from 'images/icon-new-tab.svg';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import ProModal from 'components/share/ProModal';
import { ROUTES, ROUTE_KEYS, routes } from '../routes';

const VISIBLE_ITEMS = {
  group: true,
  user: true,
  instanceType: true,
  secret: true,
  system: true,

  // Control by global or tier variable
  image: false,
  buildImage: false,
  volume: false,
  jupyterhub: false,
  usageReport: false,
  apps: false,
};

const EXTERNAL_LINKS = {
  maintenance: {
    name: 'Maintenance',
    visible: false,
    link: '/maintenance',
  },
  grafana: {
    name: 'Grafana',
    visible: false,
    link: '/grafana/login/generic_oauth',
  },
};

export function AdminSidebar() {
  const GLOBAL_ENV = __ENV__;

  const [activeRoute, setActiveRoute] = useState<ROUTE_KEYS>('group');
  const [visible, setVisible] = useState(VISIBLE_ITEMS);
  const [externalVisible, setExternalVisisble] = useState(EXTERNAL_LINKS);
  const [modal, setModal] = useState(false);

  const location = useLocation();
  const { appPrefix } = useRoutePrefix();

  useEffect(() => {
    if (window?.enableMaintenanceNotebook) {
      setExternalVisisble(prev => ({
        ...prev,
        maintenance: {
          ...prev.maintenance,
          enable: true,
        },
      }));
    }

    if (window?.enableGrafana) {
      setExternalVisisble(prev => ({
        ...prev,
        grafana: {
          ...prev.grafana,
          enable: true,
        },
      }));
    }

    if (GLOBAL_ENV === 'ee') {
      setVisible(prev => ({
        ...prev,
        image: true,
        buildImage: true,
        volume: true,
        jupyterhub: true,
        usageReport: true,
        apps: true,
      }));
    }

    if (GLOBAL_ENV === 'ce') {
      setVisible(prev => ({
        ...prev,
        image: true,
        volume: true,
        jupyterhub: true,
        usageReport: true,
        apps: true,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Split by `/admin` => [prefix, routes]
    const routes = location.pathname.split('/admin')[1];

    // Get parent path
    const currentRoute = routes.split('/')[1] as ROUTE_KEYS;

    if (ROUTES.includes(currentRoute)) {
      setActiveRoute(currentRoute);
    }
  }, [location]);

  const closeModal = () => {
    setModal(false);
  };

  const renderMenuItem = route => {
    const { key } = route;
    if (visible[key] && route.enabled) {
      return (
        <Menu.Item
          key={route.key}
          data-testid={route.key}
          onClick={
            route.proFeature && GLOBAL_ENV === 'ce'
              ? () => setModal(true)
              : () => setActiveRoute(route.key)
          }
        >
          {route.proFeature && GLOBAL_ENV === 'ce' ? (
            <span>
              {route.name}
              <Badge>pro</Badge>
            </span>
          ) : (
            <Link to={`${appPrefix}${route.path}`}>{route.name}</Link>
          )}
        </Menu.Item>
      );
    }
  };

  return (
    <Layout.Sider style={{ position: 'fixed', height: '100%' }}>
      <Menu
        theme='dark'
        selectedKeys={[activeRoute]}
        data-testid={`${activeRoute}-active`}
      >
        <Menu.Item key='backToUserPortal'>
          <a href='/'>
            <Icon type='left' />
            Back to User Portal
          </a>
        </Menu.Item>

        {routes.map(renderMenuItem)}

        {Object.keys(externalVisible).map(
          ex =>
            externalVisible[ex].enable && (
              <Menu.Item key={ex}>
                <a
                  target='_blank'
                  rel='noopener'
                  href={externalVisible[ex].link}
                >
                  {externalVisible[ex].name}

                  <img
                    src={ExternalLinkIcon}
                    width='10px'
                    height='10px'
                    style={{ marginLeft: '8px' }}
                  />
                </a>
              </Menu.Item>
            )
        )}
      </Menu>
      <ProModal visible={modal} onOk={closeModal} onCancel={closeModal} />
    </Layout.Sider>
  );
}
