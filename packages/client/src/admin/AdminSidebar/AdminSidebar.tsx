import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Icon } from 'antd';

import ExternalLinkIcon from 'images/icon-new-tab.svg';

import { ROUTES, ROUTE_KEYS, routes } from '../routes';

const VISIBLE_ITEMS = {
  group: true,
  user: true,
  instanceType: true,
  image: true,
  buildImage: true,
  dataset: true,
  secret: true,
  jupyterhub: true,
  system: true,

  // Control by global variable
  usageReport: false,
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
  const [appPrefix, setAppPrefix] = React.useState(undefined);
  const [activeRoute, setActiveRoute] = React.useState<ROUTE_KEYS>('group');
  const [visible, setVisible] = React.useState(VISIBLE_ITEMS);
  const [externalVisible, setExternalVisisble] = React.useState(EXTERNAL_LINKS);

  const location = useLocation();

  React.useEffect(() => {
    const prefix = window?.APP_PREFIX ? window.APP_PREFIX : '/';
    setAppPrefix(prefix);

    if (window?.enableUsageReport) {
      setVisible((prev) => ({
        ...prev,
        usageReport: true,
      }));
    }

    if (window?.enableMaintenanceNotebook) {
      setExternalVisisble((prev) => ({
        ...prev,
        maintenance: {
          ...prev.maintenance,
          enable: true,
        },
      }));
    }

    if (window?.enableGrafana) {
      setExternalVisisble((prev) => ({
        ...prev,
        grafana: {
          ...prev.grafana,
          enable: true,
        },
      }));
    }
  }, []);

  React.useEffect(() => {
    // Split by `/admin` => [prefix, routes]
    const routes = location.pathname.split('/admin')[1];

    // Get parent path
    const currentRoute = routes.split('/')[1] as ROUTE_KEYS;

    if (ROUTES.includes(currentRoute)) {
      setActiveRoute(currentRoute);
    }
  }, [location]);

  return (
    <Layout.Sider style={{ position: 'fixed', height: '100%' }}>
      <Menu
        theme="dark"
        selectedKeys={[activeRoute]}
        data-testid={`${activeRoute}-active`}
      >
        <Menu.Item key="backToUserPortal">
          <a href="/">
            <Icon type="left" />
            Back to User Portal
          </a>
        </Menu.Item>

        {routes.map(
          (route) =>
            visible[route.key] && (
              <Menu.Item
                key={route.key}
                data-testid={route.key}
                onClick={() => setActiveRoute(route.key)}
              >
                <Link
                  to={appPrefix ? `${appPrefix}${route.path}` : `${route.path}`}
                >
                  {route.name}
                </Link>
              </Menu.Item>
            )
        )}

        {Object.keys(externalVisible).map(
          (ex) =>
            externalVisible[ex].enable && (
              <Menu.Item key={ex}>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={externalVisible[ex].link}
                >
                  {externalVisible[ex].name}

                  <img
                    src={ExternalLinkIcon}
                    width="10px"
                    height="10px"
                    style={{ marginLeft: '8px' }}
                  />
                </a>
              </Menu.Item>
            )
        )}
      </Menu>
    </Layout.Sider>
  );
}
