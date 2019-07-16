import * as React from 'react';
import ReactDOM from 'react-dom';
import {Layout, Menu, Row, Col, Card, Avatar, notification, Button} from 'antd';
import styled from 'styled-components';
// @ts-ignore
import logo from 'images/primehub-logo.svg';
// @ts-ignore
import emptyBox from 'images/empty-box.svg';
import {BackgroundTokenSyncer} from './workers/backgroundTokenSyncer';

const PAGE_PADDING = 64;
const HEADER_HEIGHT = 64;

const Logo = styled.div`
  background-image: url(${logo});
  background-size: contain;
  background-position: left;
  background-repeat: no-repeat;
  width: 200px;
  margin: 8px 0;
` as any;

const Header = styled(Layout.Header)`
  background: #fff;
  display: flex;
  justify-content: space-between;
  .ant-menu-item .anticon, .ant-menu-submenu-title .anticon {
    margin: 0;
  }
  height: ${HEADER_HEIGHT}px;
  padding: 0 ${PAGE_PADDING}px;
  position: fixed;
  z-index: 1;
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
` as any;

const Content = styled(Layout.Content)`
  margin: ${HEADER_HEIGHT + 24}px ${PAGE_PADDING}px;
  padding: 24;
  min-height: calc(100vh - 64px);
`

const Empty = (props: {height: number, description?: string}) => (
  <Card
    style={{
      width: '100%',
      height: props.height
    }}
    bodyStyle={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%'
    }}
  >
    <div style={{textAlign: 'center'}}>
      <img src={emptyBox} />
      <p style={{marginTop: 12, color: '#aaa'}}>
        {props.description || 'no data'}
      </p>
    </div>
  </Card>
)

class Landing extends React.Component {
  onClickMenu = (item: any) => {
    const portal = (window as any).portal || {
      userProfileLink: '',
      changePasswordLink: '',
      logoutLink: '',
    }
    switch (item.key) {
      case 'userProfile': {
        (window as any).location.href = portal.userProfileLink;
        break;
      }
      case 'changePassword': {
        (window as any).location.href = portal.changePasswordLink;
        break;
      }
      case 'logout': {
        (window as any).location.href = portal.logoutLink;
      }
    }
  }

  render() {
    const isUserAdmin = (window as any).isUserAdmin || false;
    const thumbnail = (window as any).thumbnail;
    const portal = (window as any).portal || {
      services: [],
      welcomeMessage: ''
    };
    const {services, welcomeMessage} = portal;
    const normalServices = services.filter(sv => !sv.adminOnly);
    return (
      <Layout>
        <Header>
          <Logo />
          <Menu
            onClick={this.onClickMenu}
            theme="light"
            mode="horizontal"
            style={{ lineHeight: '64px', border: 0 }}
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
              <Menu.Item key="logout" style={{borderTop: '1px solid #f1f1f1'}}>
                Logout
              </Menu.Item>
            </Menu.SubMenu>
          </Menu>
        </Header>
        <Content>
          <Section title="">
            <ServiceCards services={normalServices} colHeight={200} />
          </Section>
          {
            isUserAdmin && (
              <Section title="Admin Section">
                <ServiceCards services={services.filter(sv => sv.adminOnly)} colHeight={200} />
              </Section>
            )
          }
          <Section>
            <div dangerouslySetInnerHTML={{ __html: welcomeMessage}} />
          </Section>
        </Content>
      </Layout>
    )
  }
}

type Service = {
  name: string,
  uri: string,
  adminOnly: boolean,
  image: string
};
type CardProps = {
  service: Service,
  imageHeight: number
}

type CardsProps = {
  services: Array<Service>,
  colHeight: number
}

type SectionProps = {
  title?: string,
  children: any;
}

const Section = (props: SectionProps) => {
  const {title, children} = props;
  return (
    <div style={{marginBottom: 64}}>
      {title && (<h2>{title}</h2>)}
      <div style={{marginTop: 32}}>
        {children}
      </div>
    </div>
  );
}

const ServiceCard = (props: CardProps) => {
  const {service, imageHeight} = props;
  return (<>
    <Card
      onClick={() => (window as any).location.href = service.uri}
      hoverable
    >
      <div style={{
        cursor: 'pointer',
        backgroundImage: `url(${service.image})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: imageHeight
      }} />
    </Card>
    <h3
      style={{
        fontWeight: 'normal',
        textAlign: 'center',
        marginTop: 16,
        letterSpacing: 1,
        color: '#6a6a6a'
      }}
    >
      {service.name}
    </h3>
  </>);
}

const ServiceCards = (props: CardsProps) => {
  const {services, colHeight} = props;
  if (!services.length) {
    return (
      <Empty
        height={colHeight}
        description="There is no any service."
      />
    )
  }
  return (
    <Row type="flex" gutter={32} >
      {services.map(service => {
        return (
          <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={4}>
            <ServiceCard service={service} imageHeight={colHeight}/>
          </Col>
        )
      })}
    </Row>
  )
}

/**
 * Background worker
 */
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    (error as any).response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

const tokenSyncWorker = new BackgroundTokenSyncer({
  appPrefix: (window as any).APP_PREFIX,
  refreshTokenExp: (window as any).refreshTokenExp,
  accessTokenExp: (window as any).accessTokenExp,
  getNewTokenSet: () => {
    return fetch(`${(window as any).APP_PREFIX}oidc/refresh-token-set`, {
      method: 'POST'
    })
    .then(checkStatus)
    .then(parseJSON);
  },
  reLoginNotify: ({loginUrl}) => {
    // notify with fixed card
    notification.warning({
      message: 'Warning',
      description: 'In less than 1 minute, you\'re going to be redirected to login page.',
      placement: 'bottomRight',
      duration: null,
      btn: (
        <Button type="primary" onClick={() => window.location.replace(`${(window as any).APP_PREFIX}oidc/logout`)}>
          Login Again
        </Button>
      ),
      key: 'refreshWarning'
    });
  }
})
tokenSyncWorker.run().catch(console.error);

// render
ReactDOM.render(
  <Landing />
, document.getElementById('root'));
