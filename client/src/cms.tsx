import * as React from 'react';
import {injectIntl} from 'react-intl';
import {Layout, Menu, Icon, notification, Modal, Avatar} from 'antd';
import Canner from 'canner';
import Container from '@canner/container';
import R from '@canner/history-router';
import ContentHeader from 'components/header';
import Error from 'components/error';
import styled, {StyledComponentClass} from 'styled-components';
import color from 'styledShare/color';
import logo from 'images/primehub-logo-w.png';
import {RouteComponentProps} from 'react-router';
import schema from '../schema/index.schema.js';
const {Sider} = Layout;
const confirm = Modal.confirm;
declare var process : {
  env: {
    NODE_ENV: string
  }
}

export const Logo = styled.img`
  background-color: ${color.darkBlue};
  padding: 20px;
  width: 100%;
`

export interface Props extends RouteComponentProps<void> {
  intl: any;
}

export interface State {
  prepare: boolean;
  hasError: boolean;
  deploying: boolean;
  dataChanged: Object;
}

@injectIntl
export default class CMSPage extends React.Component<Props, State> {

  state = {
    prepare: false,
    hasError: false,
    deploying: false,
    dataChanged: {}
  }

  container: Container

  // componentWillMount() {
  //   const {history, location} = this.props;
  //   firebase.auth().onAuthStateChanged((user) => {
  //     if (!user) {
  //       history.push({
  //         pathname: "/login",
  //         state: { from: location }
  //       })
  //     }
  //   })
  // }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    console.log(error, info);
  }

  dataDidChange = (dataChanged: object) => {
    console.log(dataChanged);
    this.setState({
      dataChanged
    });
  }

  afterDeploy = () => {
    const {intl} = this.props;
    setTimeout(() => {
      this.setState({
        deploying: false
      });
      notification.success({
        message: intl.formatMessage({
          id: 'deploy.success.message',
          defaultMessage: 'Save successfully!'
        }),
        description: intl.formatMessage({
          id: 'deploy.success.description',
          defaultMessage: 'Your changes have been saved.'
        }),
        placement: 'bottomRight'
      });
    }, 400);
  }

  reset = () => {
    if (this.container) {
      return this.container.cannerRef.current.reset();
    }
    return Promise.resolve();
  }

  siderMenuOnClick = (menuItem: {key: string}) => {
    const {history, intl} = this.props;
    const {dataChanged} = this.state;
    const {key} = menuItem;

    if (dataChanged && Object.keys(dataChanged).length > 0) {
      confirm({
        title: intl.formatMessage({
          id: 'deploy.confirm.title',
          defaultMessage: 'Do you want to undo the changes?'
        }),  
        content: intl.formatMessage({
          id: 'deploy.confirm.content',
          defaultMessage: `Your changes will be lost, if you don't save them.`
        }),
        okText: intl.formatMessage({
          id: 'deploy.confirm.ok',
          defaultMessage: `Undo`
        }),
        cancelText: intl.formatMessage({
          id: 'deploy.confirm.cancel',
          defaultMessage: `Cancel`
        }),
        onOk: () => {
          return new Promise((resolve, reject) => {
            setTimeout(resolve, 1000);
          }).then(this.reset)
            .then(() => {
              history.push(`/cms/${key}`);
            });
        },
        onCancel: () => {
        }
      });
    } else {
      history.push(`/cms/${key}`);
    }
  }

  render() {
    const {history, match} = this.props;
    const {prepare, hasError, deploying, dataChanged} = this.state;
    const hasChanged = !!(dataChanged && Object.keys(dataChanged).length);

    if (hasError) {
      return <Error/>;
    }
    return (
      <Layout style={{minHeight: '100vh'}}>
        <Sider breakpoint="sm">
          <Logo src={logo}/>
          <Menu
            onClick={this.siderMenuOnClick}
            selectedKeys={[(match.params as any).activeKey]}
            theme="dark"
            mode="inline">
            {/* <Menu.Item key="__cnr_back">
              <Icon type="left" />
              Back to dashboard
            </Menu.Item> */}
            {
              Object.keys(schema.schema).map(key => (
                <Menu.Item key={key}>
                  {schema.schema[key].title}
                </Menu.Item>
              ))
            }
          </Menu>
        </Sider>
        <Container
          schema={schema}
          sidebarConfig={{
            menuConfig: false
          }}
          navbarConfig={{
            renderMenu: () => <ContentHeader
              appUrl={''}
              deploying={deploying}
              hasChanged={hasChanged}
              subMenuTitle={<span><Avatar src={(window as any).thumbnail} style={{marginRight: '10px'}}/>Hi, {(window as any).username}</span>}
            />
          }}
          router={new R({
            history,
            baseUrl: "/cms"
          })}
          ref={container => this.container = container}
          dataDidChange={this.dataDidChange}
        >
          <Canner
            afterDeploy={this.afterDeploy}
            intl={{
              locale: (window as any).LOCALE,
            }}
            errorHandler={e => {
              return notification.error({
                message: e.message,
                description: '',
                placement: 'bottomRight'
              });
            }}
          />
        </Container>
      </Layout>
    )
  }
}
