import * as React from 'react';
import {Breadcrumb, Icon, Button} from 'antd';
import {Item} from 'canner-helpers';
import {get} from 'lodash';

export default class Body extends React.Component {
  back = () => {
    const {goTo, routerParams} = this.props;
    const groupId = get(routerParams, 'payload.backToGroup', '');
    if (groupId) {
      goTo({
        pathname: `group/${groupId}`,
        operator: 'update',
      });
    } else {
      goTo({
        pathname: `dataset`,
      })
    }
  }

  render() {
    const {title, description, schema, routes, routerParams} = this.props;
    const key = routes[0];
    const item = schema[key];
    const groupId = get(routerParams, 'payload.backToGroup', '');
    const breadcrumbs = [{
      path: 'home',
      render: () => <Icon type="home" />
    }, {
      path: 'dataset',
      render: () => 'Datasets'
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
        minHeight: '100vh'
      }}>
        <Button
          onClick={this.back}
          style={{
            marginBottom: 16,
            display: routerParams.operator === 'update' ? undefined : 'none',
          }}
        >
          <Icon type="arrow-left" />
          { groupId ? 
            ` Back to group`:
            ' Back'
          }
        </Button>
        <Item />
      </div>
    </div>;
  }
}
