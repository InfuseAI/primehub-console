import React from 'react';
import { Layout, notification, Modal } from 'antd';
import { injectIntl } from 'react-intl';
import Canner from 'canner';
import gql from 'graphql-tag';
import { Switch } from 'react-router-dom';
import R from '@canner/history-router';
import ContentHeader from 'components/header';
import Error from 'components/error';
// Will fixed after canner deps dropped.
// @ts-ignore
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
import { errorHandler } from 'utils/errorHandler';

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
  dataChanged: any;
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

  process = schema => {
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
  }

  dataDidChange = (dataChanged: any) => {
    this.setState({
      dataChanged,
    });
  };

  beforeFetch = (key, { _client, query, variables }) => {
    // refetch the buildImage list after update
    if (key === 'buildImage' && !query) {
      try {
        query = gql`
          ${this.schema.schema.buildImage.graphql}
        `;
        const data = _client.readQuery({
          query,
          variables,
        });
        // if cached, clean it
        if (data) _client.clearStore();
      } catch (e) {
        errorHandler(e);
      }
    }

    return {
      query,
      variables,
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
        variables,
      };
    } else {
      // create
      return {
        mutation,
        variables,
      };
    }
  };

  afterDeploy = data => {
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
                href='javascript:;'
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
          return new Promise(resolve => {
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
  }

  replaceDatasetMutation = mutation => {
    if (mutation.indexOf('updateDataset') >= 0) {
      return updateDatasetMutation;
    }
    if (mutation.indexOf('createDataset') >= 0) {
      return createDatasetMutation;
    }
    return mutation;
  };

  removeBuildImageJobs = variables => {
    delete variables.payload.buildImageJobs;
    return variables;
  };

  render() {
    const { history } = this.props;
    const { hasError } = this.state;
    const ErrorAlert = () => {
      if (hasError) {
        return <Error />;
      } else {
        return <></>;
      }
    };
    const CommonLayout = ({ children }) => {
      return (
        <Layout style={{ minHeight: '100vh' }}>
          <GlobalStyle />
          <ContentHeader />
          <Layout style={{ marginTop: 64 }}>
            <AdminSidebar />
            <Content style={{ marginLeft: 200 }}>{children}</Content>
          </Layout>
        </Layout>
      );
    };

    if (hasError) {
      return (
        <CommonLayout>
          <ErrorAlert />
        </CommonLayout>
      );
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
      <CommonLayout>
        <React.Fragment>
          <ApolloProvider client={client}>
            {window.enableLicenseCheck && <LicenseWarningBanner />}
            <Switch>{adminRoutes.map(RouteWithSubRoutes)}</Switch>
          </ApolloProvider>
          {this.notification}
          <Canner
            schema={this.schema}
            goTo={router.goTo}
            routes={routes}
            ref={canner => (this.cannerRef = canner)}
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
            errorHandler={errorHandler}
          />
        </React.Fragment>
      </CommonLayout>
    );
  }
}

function getCreateId(result) {
  return result[Object.keys(result)[0]].id;
}
