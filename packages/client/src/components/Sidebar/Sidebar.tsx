import React, { useState, useEffect, useContext, useMemo } from 'react';
import styled from 'styled-components';
import {
  Button,
  Layout,
  Modal,
  Menu,
  Divider,
  Card,
  Row,
  Col,
  Icon,
} from 'antd';
import { Link, useParams, useLocation } from 'react-router-dom';

import { UserContext } from 'context/user';
import {
  SidebarList,
  SidebarPathList,
  PATH_KEY_LIST,
} from 'components/Sidebar/types';
import { useRoutePrefix } from 'hooks/useRoutePrefix';

const ExModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 10px;
    background-color: #f0f6fd;
  }
  .ant-modal-header {
    background-color: #f0f6fd;
    border-bottom: none;
    border-radius: 10px;
  }
  .ant-modal-title {
    font-weight: 200 !important;
    font-size: 20px;
    color: #4e77cf;
  }

  .ant-modal-body {
    padding: 24px 48px 42px;
    border-radius: 10px;
  }

  .ant-card {
    box-shadow: #6282e64a 1px 1px 24px 0;
  }

  .ant-card-head-title {
    font-weight: 300;
    color: #4e77cf;
  }

  .ant-card-body {
    padding: 24px 32px;
  }
`;

const ActionRow = styled.div`
  margin-top: 20px;
  text-align: center;
  .ant-btn {
    width: 140px;
    padding: 0 auto;
    font-weight: 700;
    font-size: 11px;
  }
  .find-out-more {
    font-size: 10px;
  }
`;

const CurrentRow = styled(ActionRow)`
  .ant-btn {
    color: #5b7cc9 !important;
    background-color: #fff !important;
    border-width: 2px !important;
    border-color: #5b7cc9 !important;
  }
`;

const MenuIcon = styled.img`
  width: 25px;
  height: 25px;
`;

const Title = styled.span`
  margin-left: 16px;
`;

const Badge = styled.span`
  position: absolute;
  top: 12px;
  left: 155px;
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
  pro: <Badge>pro</Badge>,
};

const ProModal = (props: any) => {
  const { visible, onOk, onCancel } = props;
  const ceFeatures = ['Notebook', 'Shared Files', 'Apps'];
  const eeFeatures = ['Jobs', 'Schedule Jobs', 'Models', 'Deployments'];
  const FeatureItem = (props: any) => {
    const { children, key, available } = props;
    return (
      <p key={key}>
        <Icon
          type={available ? 'check-circle' : 'close-circle'}
          theme='filled'
          style={{
            marginLeft: 16,
            color: `${available ? '#00cb5d' : '#ff3845'}`,
          }}
        />{' '}
        <span style={{ marginLeft: 8 }}>{children}</span>
      </p>
    );
  };

  return (
    <ExModal
      width={550}
      title='Upgrade to Enterprise Edition'
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
      footer={null}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Row>
            <Card
              title='Community Edition'
              headStyle={{
                textAlign: 'center',
                fontWeight: 200,
              }}
            >
              {ceFeatures.map((text, index) => (
                <FeatureItem key={`ce-${index}`} available={true}>
                  {text}
                </FeatureItem>
              ))}
              {eeFeatures.map((text, index) => (
                <FeatureItem key={`ee-${index}`} available={false}>
                  {text}
                </FeatureItem>
              ))}
              <CurrentRow>
                <Button
                  shape='round'
                  style={{ cursor: 'default', marginBottom: 21 }}
                >
                  CURRENT
                </Button>
              </CurrentRow>
            </Card>
          </Row>
        </Col>
        <Col span={12}>
          <Card
            title='Enterprise Edition'
            headStyle={{
              textAlign: 'center',
              fontWeight: 200,
            }}
          >
            {ceFeatures.concat(eeFeatures).map((text, index) => (
              <FeatureItem key={`ee-${index}`} available={true}>
                {text}
              </FeatureItem>
            ))}
            <ActionRow>
              <Button
                shape='round'
                type='primary'
                href='https://www.infuseai.io/request-demo'
              >
                TRIAL
              </Button>
              <div>
                <a
                  className='find-out-more'
                  href='https://docs.primehub.io/docs/comparison'
                >
                  Find out more
                </a>
              </div>
            </ActionRow>
          </Card>
        </Col>
      </Row>
    </ExModal>
  );
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
      item => currentUser?.isCurrentGroupAdmin && item?.groupAdminOnly
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

  const handleOk = () => {
    setModal(false);
  };

  const handleCancel = () => {
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
      <ProModal visible={modal} onOk={handleOk} onCancel={handleCancel} />
    </Layout.Sider>
  );
}
