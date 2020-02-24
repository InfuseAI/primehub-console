import * as React from 'react';
import {Tabs} from 'antd';
import {Item} from 'canner-helpers';
const TabPane = Tabs.TabPane;

type Props = {
  routerParams: {
    operator: string;
    payload: Record<string, any>;
  },
  goTo: Function;
  routes: Array<string>;
}

export default class ImageJobTab extends React.Component<Props> {
  onChangeTab = (keyName: string) => {
    const {goTo, routerParams, routes} = this.props;
    const payload = routerParams.payload || {};
    goTo({
      pathname: routes.join('/'),
      ...routerParams,
      payload: {
        ...payload,
        tab: keyName
      }
    });
  }

  render() {
    const {children, routerParams} = this.props;
    const payload = routerParams.payload || {};
    return (
      <Tabs activeKey={payload.tab || 'info'} onChange={this.onChangeTab}>
        {
          children
            .filter(child => {
              if (routerParams.operator === 'create' && child.keyName === 'jobs') {
                // hide jobs tab in create form
                return false;
              }
              return true;
            })
            .map((child, i) => (
            <TabPane key={child.keyName} tab={child.title} data-testid={`tabs-${child.keyName}`} >
              <Item
                hideTitle={true}
                filter={node => node.keyName === child.keyName}
              />
            </TabPane>
          ))
        }
      </Tabs>
    )
  }
}