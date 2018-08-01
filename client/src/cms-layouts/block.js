// @flow

import * as React from 'react';
import {Item} from 'canner-helpers';

export default class Block extends React.Component {
  render() {
    // eslint-disable-next-line no-unused-vars
    const {title, description, params, disabledKeysInCreate, children} = this.props;
    return <React.Fragment>
      {
        children.map((child, i) => (
          !isDisabled({
            keys: disabledKeysInCreate,
            params,
            childKeyName: child.keyName
          }) && <Item
            hideTitle={true}
            filter={node => node.keyName === child.keyName}
          />
        ))
      }
    </React.Fragment>;
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