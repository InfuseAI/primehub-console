import React from 'react';
import { Layout, notification } from 'antd';
import { injectIntl } from 'react-intl';
import { Switch } from 'react-router-dom';
import ContentHeader from 'components/header';
import Error from 'components/error';
// @ts-ignore
import { createGlobalStyle } from 'styled-components';
import { ApolloProvider } from 'react-apollo';
import { createGraphqlClient } from 'utils/graphqlClient';
import { fakeData, schema } from './fakeData';
import { RouteComponentProps } from 'react-router';
import LicenseWarningBanner from 'ee/components/shared/licenseWarningBanner';

import { AdminSidebar } from './admin/AdminSidebar';
import { RouteWithSubRoutes, routes as adminRoutes } from './admin/routes';

const { Content } = Layout;

const client = createGraphqlClient({
  fakeData,
  schema,
});

const GlobalStyle = createGlobalStyle`
  .ant-menu-dark.ant-menu-submenu-popup {
    position: fixed;
  }
`;

export interface Props extends RouteComponentProps<void> {
  intl: any;
}

export interface State {
  hasError: boolean;
}

@injectIntl
export default class CMSPage extends React.Component<Props, State> {
  schema = null;
  notification = null;

  state = {
    hasError: false,
  };

  constructor(props) {
    super(props);
    this.notification = props.notification;
  }

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
    console.error(error, info);
    // Display fallback UI
    this.setState({ hasError: true });
  }

  render() {
    const { hasError } = this.state;

    if (hasError) {
      return (
        <Layout style={{ minHeight: '100vh' }}>
          <GlobalStyle />
          <ContentHeader />
          <Layout style={{ marginTop: 64 }}>
            <AdminSidebar />
            <Content style={{ marginLeft: 200 }}>
              <Error />
            </Content>
          </Layout>
        </Layout>
      );
    }

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <GlobalStyle />
        <ContentHeader />
        <Layout style={{ marginTop: 64 }}>
          <AdminSidebar />
          <Content style={{ marginLeft: 200 }}>
            <ApolloProvider client={client}>
              {window.enableLicenseCheck && <LicenseWarningBanner />}
              <Switch>{adminRoutes.map(RouteWithSubRoutes)}</Switch>
            </ApolloProvider>
            {this.notification}
          </Content>
        </Layout>
      </Layout>
    );
  }
}

