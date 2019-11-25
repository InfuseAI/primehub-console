import * as React from 'react';
import {Tabs} from 'antd';
import {Item} from 'canner-helpers';
const TabPane = Tabs.TabPane;

export default class ImageJobTab extends React.Component {
  render() {
    const {children, routerParams} = this.props;
    return (
      <Tabs>
        {
          children
            .filter(child => {
              if (routerParams.operator === 'create' && child.keyName === 'jobs') {
                return false;
              }
              return true;
            })
            .map((child, i) => (
            <TabPane key={i} tab={child.title} data-testid={`tabs-${child.keyName}`} >
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