import * as React from 'react';
import {injectIntl} from 'react-intl';
import {Layout, Menu, Icon, notification, Modal, Avatar, Button} from 'antd';
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
import myLocales from './utils/locales';
import get from 'lodash.get';
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

  componentDidUpdate(prevProps: Props) {
    const prevPathname = prevProps.location.pathname;
    const prevSearch = prevProps.location.search;
    const pathname = this.props.location.pathname;
    const search = this.props.location.search;
    if (prevPathname !== pathname || (prevSearch === '' && search === '?operator=create')) {
      notification.destroy();
    }
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    console.log(error, info);
  }

  dataDidChange = (dataChanged: object) => {
    this.setState({
      dataChanged
    });
  }

  afterDeploy = (data) => {
    const {intl, history} = this.props;
    if (get(data, 'actions.0.type') === 'CREATE_ARRAY') {
      const link = `${(window as any).APP_PREFIX}cms/${data.key}/${getCreateId(data.result)}`;
      setTimeout(() => {
        this.setState({
          deploying: false
        });
        notification.success({
          message: intl.formatMessage({
            id: 'deploy.success.message',
            defaultMessage: 'Save successfully!'
          }),
          description: (
            <div>
            {
              intl.formatMessage({
                id: 'deploy.success.create.description1',
                defaultMessage: 'Your changes have been saved. Click'
              })
            }
            <a href="javascript:;" onClick={() => history.push(link)} style={{margin: '0 8px'}}>
            {
              intl.formatMessage({
                id: 'deploy.success.create.description2',
                defaultMessage: 'here'
              })
            }
            </a>
            {
              intl.formatMessage({
                id: 'deploy.success.create.description3',
                defaultMessage: 'to edit.'
              })
            }
            </div>
          ),
          duration: 10,
          placement: 'bottomRight'
        });
      }, 400);
      return ;
    }
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
          defaultMessage: 'Do you want to discard the changes?'
        }),  
        content: intl.formatMessage({
          id: 'deploy.confirm.content',
          defaultMessage: `Your changes will be lost. Are you sure?`
        }),
        okText: intl.formatMessage({
          id: 'deploy.confirm.ok',
          defaultMessage: `Discard`
        }),
        cancelText: intl.formatMessage({
          id: 'deploy.confirm.cancel',
          defaultMessage: `Cancel`
        }),
        onOk: () => {
          return new Promise((resolve, reject) => {
            resolve();
          }).then(this.reset)
            .then(() => {
              history.push(`${(window as any).APP_PREFIX}cms/${key}`);
            });
        },
        onCancel: () => {
        }
      });
    } else {
      history.push(`${(window as any).APP_PREFIX}cms/${key}`);
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
            baseUrl: `${(window as any).APP_PREFIX}cms`
          })}
          ref={container => this.container = container}
          dataDidChange={this.dataDidChange}
        >
          <Canner
            afterDeploy={this.afterDeploy}
            intl={{
              locale: (window as any).LOCALE,
              messages: {
                ...myLocales
              }
            }}
            errorHandler={e => {
              console.dir(e);
              // default message and description
              let message = e.message || 'Error';
              let description = '';
              let btn;
              let key;
              let duration;

              // get the first error
              let errorCode;
              // from networkError
              if (e.networkError) {
                errorCode = get(e, 'networkError.result.errors.0.extensions.code');
              } else {
                // from graphQLErrors
                errorCode = get(e, 'graphQLErrors.0.extensions.code');
              }

              switch (errorCode) {
                case 'USER_CONFLICT_USERNAME':
                  message = 'Conflict Error';
                  description = 'User exists with same username';
                  break;

                case 'USER_CONFLICT_EMAIL':
                  message = 'Conflict Error';
                  description = 'User exists with same email';
                  break;

                case 'GROUP_CONFLICT_NAME':
                  message = 'Conflict Error';
                  description = 'Group exists with same name';
                  break;

                case 'RESOURCE_CONFLICT':
                  message = 'Conflict Error';
                  description = 'Resource name already exist';
                  break;

                case 'REFRESH_TOKEN_EXPIRED':
                  // show notification with button
                  message = 'Token Expired or Invalid';
                  description = 'Please login again';
                  const loginUrl = get(e, 'networkError.result.errors.0.loginUrl');
                  // add current location to redirect_uri
                  duration = 20;
                  key = 'REFRESH_TOKEN_EXPIRED';
                  btn = (
                    <Button type="primary" onClick={() => window.location.replace(loginUrl)}>
                      Login
                    </Button>
                  );
                  break;
              }
              return notification.error({
                message,
                description,
                placement: 'bottomRight',
                duration,
                btn,
                key
              });
            }}
          />
        </Container>
      </Layout>
    )
  }
}

function getCreateId(result) {
  return result[Object.keys(result)[0]].id;
}