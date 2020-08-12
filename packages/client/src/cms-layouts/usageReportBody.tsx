import * as React from 'react';
import {Breadcrumb, Icon, Button, Spin, Alert} from 'antd';
import {Item} from 'canner-helpers';
import {injectIntl} from 'react-intl';
import styled from 'styled-components';
import {get, startCase} from 'lodash';
import {Props} from '../cms-components/types';

function getRouteName(key) {
  switch (key) {
    default:
      return `${startCase(key)}s`;
  }
}

@injectIntl
export default class UsageReportBody extends React.Component<Props> {
  state = {
    loading: false,
    loadingTip: ''
  };

  render() {
    const {title, description, schema, routes, routerParams, intl} = this.props;
    const {loading, loadingTip} = this.state;
    const key = routes[0];
    const item = schema[key];
    const groupId = get(routerParams, 'payload.backToGroup', '');
    const breadcrumbs = [{
      path: 'home',
      render: () => <Icon type="home" />
    }, {
      path: routes[0],
      render: () => getRouteName(routes[0])
    }];
    const itemRender = (route) => {
      return route.render();
    }

    return <div>
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 24px'
      }}>
        <div style={{
          marginBottom: 24
        }}>
          <Breadcrumb itemRender={itemRender} routes={breadcrumbs} />
        </div>
        <h2>{item.title || title}</h2>
        {
          (item.description || description) && (
            <div style={{
              marginTop: 8
            }}>
              {item.description || description}
            </div>
          )
        }
      </div>
      <div style={{
        margin: '16px',
        padding: '16px',
        background: '#fff',
      }}>
        <Spin tip={loadingTip} spinning={loading}>
          <Item hideBackButton hideButtons/>
        </Spin>
      </div>
    </div>;
  }
}
