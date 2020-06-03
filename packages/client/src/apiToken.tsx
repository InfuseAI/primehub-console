import * as React from 'react';
import ReactDOM from 'react-dom';
import { Layout, Card, Breadcrumb, Icon, Button, Row, Col, Input } from 'antd';
import Header from 'components/header';
import styled from 'styled-components';
import PageTitle from 'components/pageTitle';

// @ts-ignore

import { appPrefix } from 'utils/env';
import ApiTokenPage from 'containers/apiTokenPage';

const HEADER_HEIGHT = 64;

const Content = styled(Layout.Content)`
  margin-top: ${HEADER_HEIGHT}px;
  padding: 64px;
  min-height: calc(100vh - 64px);
`;

const ApiTokenBreadCrumb = () => {
  return (
    <Breadcrumb style={{ marginBottom: 8 }}>
      <Breadcrumb.Item key="home">
        <a href={`${appPrefix}`}>
          <Icon type="home" />
        </a>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        API Token
      </Breadcrumb.Item>
    </Breadcrumb>
  );
}

class ApiToken extends React.Component {
  render() {
    return (
      <Layout>
        <Header />
        <Layout>
          <Content style={{ padding: 0 }}>
              <PageTitle
                  breadcrumb={<ApiTokenBreadCrumb />}
                  title={"API Token"}
                  style={{ paddingLeft: 64 }}
              />
              <ApiTokenPage />
          </Content>
        </Layout>

      </Layout>
    )
  }
}

// render
ReactDOM.render(
  <ApiToken />
  , document.getElementById('root'));
