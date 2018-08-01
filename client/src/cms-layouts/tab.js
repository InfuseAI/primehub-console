
import * as React from 'react';
import {Tabs} from 'antd';
import {Item} from 'canner-helpers';
const TabPane = Tabs.TabPane;

export default class Tab extends React.Component {
  render() {
    const {children, disabledKeysInCreate, params} = this.props;
    return (
      <Tabs>
        {
          children.map((child, i) => (
            <TabPane key={i} tab={child.title}
              disabled={isDisabled({
                keys: disabledKeysInCreate,
                params,
                childKeyName: child.keyName
              })}
            >
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

function isDisabled({
  keys,
  params,
  childKeyName
}) {
  if (params && params.op === 'create' &&
    keys.indexOf(childKeyName) !== -1
  ) {
    return true;
  }
  return false;
}