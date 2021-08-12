import * as React from 'react';
import { Layout, notification, Modal, Button } from 'antd';
import { injectIntl, FormattedMessage } from 'react-intl';
import Canner from 'canner';
import gql from 'graphql-tag';
import { Switch } from 'react-router-dom';
import R from '@canner/history-router';
import ContentHeader from 'components/header';
import Error from 'components/error';
import styled, { createGlobalStyle } from 'styled-components';
import { ApolloProvider } from 'react-apollo';
import { createGraphqlClient } from 'utils/graphqlClient';
import { fakeData, schema as fakeDataSchema } from './fakeData';
import color from 'styledShare/color';
import { RouteComponentProps } from 'react-router';
import myLocales from './utils/locales';
import get from 'lodash/get';
import { dict } from 'schema/utils';
import LicenseWarningBanner from 'ee/components/shared/licenseWarningBanner';

import { AdminSidebar } from './admin/AdminSidebar';
import { RouteWithSubRoutes, routes as adminRoutes } from './admin/routes';

const { Content } = Layout;
const confirm = Modal.confirm;

const client = createGraphqlClient({
  fakeData,
  schema: fakeDataSchema,
});

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

const GlobalStyle = createGlobalStyle`
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
}

@injectIntl
export default class CMSPage extends React.Component<Props, State> {
  schema = null;
  notification = null;

  state = {
    prepare: false,
    hasError: false,
    deploying: false,
    dataChanged: {},
  };

  cannerRef: any;

  constructor(props) {
    super(props);
    this.schema = this.process(props.schema);
    this.notification = props.notification;
  }

  process = (schema) => {
    if (!window.enableCustomImage) {
      delete schema.schema.buildImage;
      delete schema.schema.buildImageJob;
    }
    return schema;
  };

  componentDidUpdate(prevProps: Props) {
    const prevPathname = prevProps.location.pathname;
    const prevSearch = prevProps.location.search;
    const pathname = this.props.location.pathname;
    const search = this.props.location.search;
    if (
      prevPathname !== pathname ||
      (prevSearch === '' && search === '?operator=create')
    ) {
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
      dataChanged,
    });
  };

  beforeFetch = (key, { client, query, variables }) => {
    // refetch the buildImage list after update
    if (key === 'buildImage' && !query) {
      try {
        const query = gql`
          ${this.schema.schema.buildImage.graphql}
        `;
        const data = client.readQuery({
          query,
          variables: variables,
        });
        // if cached, clean it
        if (data) client.clearStore();
      } catch {}
    }

    return {
      query,
      variables: variables,
    };
  };

  beforeDeploy = (key, { mutation, variables }) => {
    if (key === 'dataset') {
      // we replace the mutation since there will be a external field `uploadServerSecret`
      mutation = this.replaceDatasetMutation(mutation);
    }

    if (key === 'buildImage') {
      variables = this.removeBuildImageJobs(variables);
    }

    if (mutation.indexOf('$where') >= 0) {
      // update or delete
      return {
        mutation,
        variables: variables,
      };
    } else {
      // create
      return {
        mutation,
        variables: variables,
      };
    }
  };

  afterDeploy = (data) => {
    const { intl, history } = this.props;
    const actionType = get(data, 'actions.0.type');
    if (actionType === 'CREATE_ARRAY') {
      const link = `${window.APP_PREFIX}admin/${data.key}/${getCreateId(
        data.result
      )}`;
      setTimeout(() => {
        this.setState({
          deploying: false,
        });
        notification.success({
          message: intl.formatMessage({
            id: 'deploy.success.message',
            defaultMessage: 'Save successfully!',
          }),
          description: (
            <div>
              {intl.formatMessage({
                id: 'deploy.success.create.description1',
                defaultMessage: 'Your changes have been saved. Click',
              })}
              <a
                href="javascript:;"
                onClick={() => history.push(link)}
                style={{ margin: '0 8px' }}
              >
                {intl.formatMessage({
                  id: 'deploy.success.create.description2',
                  defaultMessage: 'here',
                })}
              </a>
              {intl.formatMessage({
                id: 'deploy.success.create.description3',
                defaultMessage: 'to edit.',
              })}
            </div>
          ),
          duration: 10,
          placement: 'bottomRight',
        });
      }, 400);
      return;
    }
    setTimeout(() => {
      this.setState({
        deploying: false,
      });
      notification.success({
        message: intl.formatMessage({
          id: 'deploy.success.message',
          defaultMessage: 'Save successfully!',
        }),
        description: intl.formatMessage({
          id: 'deploy.success.description',
          defaultMessage: 'Your changes have been saved.',
        }),
        placement: 'bottomRight',
      });
    }, 400);
  };

  reset = () => {
    if (this.cannerRef) {
      return this.cannerRef.reset();
    }
    return Promise.resolve();
  };

  siderMenuOnClick = (menuItem: { key: string }) => {
    const { history, intl } = this.props;
    const { dataChanged } = this.state;
    const { key } = menuItem;
    if (dataChanged && Object.keys(dataChanged).length > 0) {
      confirm({
        title: intl.formatMessage({
          id: 'deploy.confirm.title',
          defaultMessage: 'Do you want to discard the changes?',
        }),
        content: intl.formatMessage({
          id: 'deploy.confirm.content',
          defaultMessage: `Your changes will be lost. Are you sure?`,
        }),
        okText: intl.formatMessage({
          id: 'deploy.confirm.ok',
          defaultMessage: `Discard`,
        }),
        cancelText: intl.formatMessage({
          id: 'deploy.confirm.cancel',
          defaultMessage: `Cancel`,
        }),
        onOk: () => {
          return new Promise((resolve) => {
            resolve();
          })
            .then(this.reset)
            .then(() => {
              history.push(`${window.APP_PREFIX}admin/${key}`);
            });
        },
        onCancel: () => undefined,
      });
    } else if (
      dict['en'][`${key}.externalLink`] ||
      key === 'backToUserPortal'
    ) {
      // add this condition to keep page content not change when
      // opening external link or backing to user portal
    } else {
      history.push(`${window.APP_PREFIX}admin/${key}`);
    }
  };

  replaceDatasetMutation = (mutation) => {
    if (mutation.indexOf('updateDataset') >= 0) {
      return updateDatasetMutation;
    }
    if (mutation.indexOf('createDataset') >= 0) {
      return createDatasetMutation;
    }
    return mutation;
  };

  removeBuildImageJobs = (variables) => {
    delete variables.payload.buildImageJobs;
    return variables;
  };

  render() {
    const { history } = this.props;
    const { hasError } = this.state;
    if (hasError) {
      return <Error />;
    }

    const router = new R({
      history,
      baseUrl: `${window.APP_PREFIX || '/'}admin`,
    });
    const routes = router.getRoutes();
    const routerParams = {
      operator: router.getOperator(),
      payload: router.getPayload(),
      where: router.getWhere(),
      sort: router.getSort(),
      pagination: router.getPagination(),
    };

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <GlobalStyle />
        <ContentHeader />
        <Layout style={{ marginTop: 64 }}>
          <AdminSidebar />

          {/* TODO: After drop canner we can use this way */}
          {/* If want to test this, remove line 16 comment */}
          {/* <Content style={{ marginLeft: '200px' }}>
            <Switch>
              {routes.map(RouteWithSubRoutes)}
            </Switch>
          </Content> */}

          <Content style={{ marginLeft: 200 }}>
            <ApolloProvider client={client}>
              {window.enableLicenseCheck && <LicenseWarningBanner />}
              <Switch>{adminRoutes.map(RouteWithSubRoutes)}</Switch>
            </ApolloProvider>
            {this.notification}
            <Canner
              schema={this.schema}
              goTo={router.goTo}
              routes={routes}
              ref={(canner) => (this.cannerRef = canner)}
              routerParams={routerParams}
              dataDidChange={this.dataDidChange}
              afterDeploy={this.afterDeploy}
              beforeDeploy={this.beforeDeploy}
              intl={{
                locale: window.LOCALE,
                messages: {
                  ...myLocales,
                },
              }}
              beforeFetch={this.beforeFetch}
              errorHandler={(e) => {
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
                  errorCode = get(
                    e,
                    'networkError.result.errors.0.extensions.code'
                  );
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
                    const loginUrl = get(
                      e,
                      'networkError.result.errors.0.loginUrl'
                    );
                    // add current location to redirect_uri
                    duration = 20;
                    key = 'REFRESH_TOKEN_EXPIRED';
                    btn = (
                      // @ts-ignore
                      <Button
                        type="primary"
                        onClick={() => window.location.replace(loginUrl)}
                      >
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
                  key,
                });
              }}
            />
          </Content>
        </Layout>
      </Layout>
    );
  }
}

function getCreateId(result) {
  return result[Object.keys(result)[0]].id;
}
