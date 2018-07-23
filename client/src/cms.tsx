import * as axios from 'axios';
import * as React from 'react';
import {Layout, Menu, Icon, notification, Modal} from 'antd';
import {CMS, ReactRouterProvider} from 'canner';
import ContentHeader from 'components/header';
import Loading from 'components/loading';
import Error from 'components/error';
import isPlainObject from 'lodash.isplainobject';

import styled, {StyledComponentClass} from 'styled-components';
import color from 'styledShare/color';
import logo from 'images/logo-white-word-alpha.svg';
import {RouteComponentProps} from 'react-router';
import schema from '../schema/index.schema.js';

const MenuItemGroup = Menu.ItemGroup;
const {Content, Sider, Header} = Layout;
const confirm = Modal.confirm;

export const Logo = styled.img`
  background-color: ${color.darkBlue};
  padding: 20px;
  width: 100%;
`

export interface Props extends RouteComponentProps<void> {
}

export interface State {
  prepare: boolean;
  hasError: boolean;
  deploying: boolean;
  dataChanged: Object;
}

export default class CMSPage extends React.Component<Props, State> {

  state = {
    prepare: false,
    hasError: false,
    deploying: false,
    dataChanged: {}
  }

  cms: CMS

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

  deploy = () => {
    if (this.cms) {
      this.setState({
        deploying: true
      });
      return this.cms.deploy()
        .then(() => {
          setTimeout(() => {
            this.setState({
              deploying: false
            });
            notification.success({
              message: 'Save successfully!',
              description: 'Your changes have been saved.',
              placement: 'bottomRight'
            });
          }, 1000)
        });
    }
  }

  reset = () => {
    if (this.cms) {
      return this.cms.reset();
    }
    return Promise.resolve();
  }

  siderMenuOnClick = (menuItem: {key: string}) => {
    const {history} = this.props;
    const {dataChanged} = this.state;
    const {key} = menuItem;

    if (dataChanged && Object.keys(dataChanged).length > 0) {
      confirm({
        title: 'Do you want to reset all changes?',
        content: <div>Leaving without deployment will reset all changes. Click the <b>Save</b> button at the top-right corner to save them.</div>,
        okText: 'Yes',
        cancelText: 'No',
        onOk: () => {
          return new Promise((resolve, reject) => {
            setTimeout(resolve, 1000);
          }).then(this.reset)
            .then(() => {
              history.push(`/cms/${key}`);
            });
        },
        onCancel: () => {
        },
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
            <Menu.Item key="__cnr_back">
              <Icon type="left" />
              Back to dashboard
            </Menu.Item>
            {
              Object.keys(schema.schema).map(key => (
                <Menu.Item key={key}>
                  {key.toLocaleUpperCase()}
                </Menu.Item>
              ))
            }
          </Menu>
        </Sider>
        <Content style={{padding: "0"}}>
          <Header style={{padding: "0px", zIndex: 1000}}>
            <ContentHeader
              appUrl={''}
              deploying={deploying}
              hasChanged={hasChanged}
              deploy={this.deploy}/>
          </Header>
          <ReactRouterProvider
            baseUrl="/cms"
            history={history}
          >
            <CMS
              schema={schema}
              hideButtons={false}
              dataDidChange={this.dataDidChange}
              ref={cms => this.cms = cms}
            />
          </ReactRouterProvider>
        </Content>
      </Layout>
    )
  }
}
