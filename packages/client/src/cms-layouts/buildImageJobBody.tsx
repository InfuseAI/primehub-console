import * as React from 'react';
import {Breadcrumb, Icon, Button} from 'antd';
import {Item} from 'canner-helpers';
import {get} from 'lodash';

export default class Body extends React.Component {
  backToBuildImage = () => {
    const {goTo, routerParams} = this.props;
    const imageId = get(routerParams, 'payload.backToImage', '');
    if (imageId) {
      goTo({
        pathname: `buildImage/${imageId}`,
        operator: 'update',
      });
    }
  }

  render() {
    const {title, description, schema, routes, routerParams} = this.props;
    const key = routes[0];
    const item = schema[key];
    const breadcrumbs = [{
      path: 'home',
      render: () => <Icon type="home" />
    }, {
      path: 'buildImage',
      render: () => 'Build Images'
    }, {
      path: 'buildImageId',
      render: () => get(routerParams, 'payload.backToImage')
    }, {
      path: routes[0],
      render: () => 'Jobs'
    }, {
      path: routes[1],
      render: () => routes[1]
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
        <Button onClick={this.backToBuildImage} style={{marginBottom: 16}}>
          <Icon type="arrow-left" /> Back to build image
        </Button>
        <Item />
      </div>
    </div>;
  }
}
