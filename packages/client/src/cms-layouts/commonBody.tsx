import * as React from 'react';
import {Breadcrumb, Icon, Button} from 'antd';
import {Item} from 'canner-helpers';
import {get, startCase} from 'lodash';
import AddButton from './addButtton';
import {Props} from '../cms-components/types';

function getRouteName(key) {
  switch (key) {
    case 'buildImage':
      return 'Image Builder';
    case 'system':
      return startCase(key);
    default:
      return `${startCase(key)}s`;
  }
}

export default class CommonBody extends React.Component<Props> {
  back = () => {
    const {goTo, routes, routerParams} = this.props;
    const groupId = get(routerParams, 'payload.backToGroup', '');
    if (groupId) {
      goTo({
        pathname: `group/${groupId}`,
        operator: 'update',
      });
    } else {
      goTo({
        pathname: routes[0],
      })
    }
  }

  add = () => {
    const {goTo, routes} = this.props;
    goTo({
      pathname: `${routes[0]}`,
      operator: 'create'
    });
  }

  render() {
    const {title, description, schema, routes, routerParams} = this.props;
    const key = routes[0];
    const item = schema[key];
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
        <Button
          onClick={this.back}
          style={{
            marginBottom: 16,
            width: 99,
            display: routerParams.operator === 'create' || routes.length > 1 ? undefined : 'none',
          }}
        >
          <Icon type="arrow-left" />
          Back
        </Button>
        <AddButton
          add={this.add}
          display={routes.length === 1 && routerParams.operator !== 'create' ? 'flex' : 'none'}
        />
        <Item hideBackButton/>
      </div>
    </div>;
  }
}
