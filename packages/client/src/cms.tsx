import * as React from 'react';
import {injectIntl, FormattedMessage} from 'react-intl';
import {Layout, Menu, Icon, notification, Modal, Button} from 'antd';
import Canner from 'canner';
import gql from 'graphql-tag';
import {genClient} from 'canner/lib/components/index';
import R from '@canner/history-router';
import ContentHeader from 'components/header';
import Error from 'components/error';
import styled, {injectGlobal} from 'styled-components';
import color from 'styledShare/color';
import {RouteComponentProps} from 'react-router';
import schema from '../schema/index.schema.js';
import myLocales from './utils/locales';
import get from 'lodash.get';
import update from 'lodash/update';
const {Sider, Content} = Layout;
const confirm = Modal.confirm;
declare var process: {
  env: {
    NODE_ENV: string
  }
}

const updateDatasetMutation = `
  mutation($payload: DatasetUpdateInput!, $where: DatasetWhereUniqueInput!){
    updateDataset(data: $payload,where: $where){
      id
      uploadServerSecret {
        username
        password
      }
    }
  }
`;

const createDatasetMutation = `
  mutation($payload: DatasetCreateInput!){
    createDataset(data: $payload){
      id
      uploadServerSecret {
        username
        password
      }
    }
  }
`;

export const Logo = styled.img`
  background-color: ${color.darkBlue};
  padding: 20px;
  width: 100%;
`;

const ENABLE_WORKSPACE = (window as any).enableWorkspace;

injectGlobal`
  .ant-menu-dark.ant-menu-submenu-popup {
    position: fixed;
  }
`;

export interface Props extends RouteComponentProps<void> {
  intl: any;
}

export interface State {
  prepare: boolean;
  hasError: boolean;
  deploying: boolean;
  dataChanged: Object;
  workspaceList: Array<any>
}

@injectIntl
export default class CMSPage extends React.Component<Props, State> {

  state = {
    prepare: false,
    hasError: false,
    deploying: false,
    dataChanged: {},
    workspaceList: []
  };

  cannerRef: any

  componentDidMount() {
    if (!ENABLE_WORKSPACE) return;
    this.fetchWorkspaceList()
      .then(wss => {
        this.setState({
          workspaceList: wss
        });
      });
  }

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

  fetchWorkspaceList = async () => {
    const client = genClient(schema);
    const result = await client.query({
      query: gql`query {
        workspaces {
          id
          name
          displayName
          isDefault
        }
      }`
    })
    const workspaceList = result.data.workspaces;
    return workspaceList;
  }

  dataDidChange = (dataChanged: object) => {
    this.setState({
      dataChanged
    });
  }

  beforeFetch = (key, {query, variables}) => {
    const {match} = this.props;
    const {workspaceId} = match.params as any;
    const whereKey = `${key}Where`;

    if (key === 'workspace') {
      return {
        query,
        variables
      };
    }

    return {
      query,
      variables: update(variables, [whereKey], where => ({
        ...where,
        workspaceId
      }))
    };
  }

  beforeDeploy = (key, {mutation, variables}) => {
    const {match} = this.props;
    const {workspaceId} = match.params as any;

    if (key === 'workspace') {
      return {
        mutation,
        variables
      };
    }

    if (key === 'dataset') {
      // we replace the mutation since there will be a external field `uploadServerSecret`
      mutation = this.replaceDatasetMutation(mutation)
    }

    if (mutation.indexOf('$where') >= 0) {
      // update or delete
      return {
        mutation,
        variables: update(variables, ['where'], where => {
          return {
            ...where,
            workspaceId
          };
        })
      };
    } else {
      // create
      return {
        mutation,
        variables: update(variables, ['payload'], payload => {
          return {
            ...payload,
            workspaceId
          };
        })
      };
    }
  }

  afterDeploy = (data) => {
    const {intl, history, match} = this.props;
    const {workspaceId} = match.params as any;
    const actionType = get(data, 'actions.0.type');
    if (actionType === 'DELETE_ARRAY' || actionType === 'UPDATE_ARRAY') {
      if (data.key === 'workspace') {
        this.fetchWorkspaceList()
          .then(wss => {
            this.setState({
              workspaceList: wss
            });
          });
      }
    } else if (actionType === 'CREATE_ARRAY') {
      let link = `${(window as any).APP_PREFIX}cms/${workspaceId}/${data.key}/${getCreateId(data.result)}`;
      if (data.key === 'workspace') {
        this.fetchWorkspaceList()
          .then(wss => {
            this.setState({
              workspaceList: wss
            });
          });
        link = `${(window as any).APP_PREFIX}cms/${workspaceId}/${data.key}/${getCreateId(data.result)}`;
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
    if (this.cannerRef) {
      return this.cannerRef.current.reset();
    }
    return Promise.resolve();
  }

  siderMenuOnClick = (menuItem: {key: string}) => {
    const {history, intl, match} = this.props;
    const {workspaceId} = match.params as any;
    const {dataChanged, workspaceList} = this.state;
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
              history.push(`${(window as any).APP_PREFIX}cms/${workspaceId}/${key}`);
            });
        },
        onCancel: () => undefined
      });
    } else if (key.indexOf('workspace/') >= 0) {
      const wsId = key.split('/')[1];
      const currentWorkspace = workspaceList.find(ws => ws.id === wsId) || {} as any;
      history.push(`${(window as any).APP_PREFIX}cms/${wsId}/${currentWorkspace.isDefault ? 'system' : 'group'}`);
    } else if (key === 'workspace') {
      const defaultWorkspaceId = (workspaceList.find(ws => ws.isDefault) || {}).id || 'default';
      history.push(`${(window as any).APP_PREFIX}cms/${defaultWorkspaceId}/${key}`);
    } else {
      history.push(`${(window as any).APP_PREFIX}cms/${workspaceId}/${key}`);
    }
  }

  renderMenu = () => {
    const {workspaceList = []} = this.state;
    const {match} = this.props;
    const {activeKey, workspaceId} = match.params as any;
    const currentWorkspace = workspaceList.find(ws => ws.id === workspaceId) || {};
    const workspaceMenu = (
      <Menu.SubMenu
        key="workspace_list"
        style={{
          paddingTop: 36,
          paddingBottom: 12
        }}
        title={currentWorkspace.displayName || 'Default'}
      >
        {workspaceList.map(ws => (
          <Menu.Item key={`workspace/${ws.id}`}>
            {ws.displayName}
          </Menu.Item>
        ))}
        <Menu.Item key="workspace">
          <Icon type="setting" /> <FormattedMessage id="workspace.management" />
        </Menu.Item>
      </Menu.SubMenu>
    );
    return (
      <Menu
        onClick={this.siderMenuOnClick}
        selectedKeys={[activeKey, `workspace/${workspaceId}`]}
        theme="dark"
        mode="vertical"
      >
        {ENABLE_WORKSPACE && (
          <span style={{
            left: '16px',
            position: 'relative',
            top: '36px',
            fontSize: '14px'
          }}>
            WORKSPACE
          </span>
        )}
        {ENABLE_WORKSPACE && workspaceMenu}
        {
          Object.keys(schema.schema)
            .filter(key => {
              if (!ENABLE_WORKSPACE && key !== 'workspace') return true;
              if (
                !currentWorkspace.isDefault &&
                (key === 'system' || key === 'user')
              ) {
                return false;
              }
              return key !== 'workspace';
            }).map(key => (
              <Menu.Item key={key}>
                {schema.schema[key].title}
              </Menu.Item>
            ))
        }
      </Menu>
    );
  }

  replaceDatasetMutation = mutation => {
    if (mutation.indexOf('updateDataset') >= 0) {
      return updateDatasetMutation;
    }
    if (mutation.indexOf('createDataset') >= 0) {
      return createDatasetMutation;
    }
    return mutation;
  }

  render() {
    const {history, match} = this.props;
    const {hasError} = this.state;
    if (hasError) {
      return <Error/>;
    }
    const {workspaceId} = match.params as any;
    const router = new R({
      history,
      baseUrl: `${(window as any).APP_PREFIX || '/'}cms/${workspaceId}`
    });
    const routes = router.getRoutes();
    const routerParams = {
      operator: router.getOperator(),
      payload: router.getPayload(),
      where: router.getWhere(),
      sort: router.getSort(),
      pagination: router.getPagination()
    };
    return (
      <Layout style={{minHeight: '100vh'}}>
        <ContentHeader pagePadding={24}/>
        <Layout style={{marginTop: 64}}>
          <Sider breakpoint="sm"
            style={{
              position: "fixed",
              height: "100%"
            }}
          >
            {this.renderMenu()}
          </Sider>
          <Content style={{marginLeft: 200}}>
            <Canner
              // use workspaceId as the key. So, if the workspaceId changed,
              // the Canner component will re-mount to fetch correct data
              key={workspaceId}
              schema={schema}
              goTo={router.goTo}
              routes={routes}
              ref={canner => this.cannerRef = canner}
              routerParams={routerParams}
              dataDidChange={this.dataDidChange}
              afterDeploy={this.afterDeploy}
              beforeDeploy={this.beforeDeploy}
              intl={{
                locale: (window as any).LOCALE,
                messages: {
                  ...myLocales
                }
              }}
              beforeFetch={this.beforeFetch}
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
                  case 'REQUEST_BODY_INVALID':
                    message = 'Invalidation Error';
                    description = 'The requested body is not valid';
                    break;

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
          </Content>
        </Layout>
      </Layout>
    )
  }
}

function getCreateId(result) {
  return result[Object.keys(result)[0]].id;
}
