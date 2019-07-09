import React from 'react';
import {Alert} from 'antd';
import {Item} from 'canner-helpers';

export default class Options extends React.Component {
  render() {
    const {rootValue, value, uiParams: {selectedKey, options}, refId} = this.props;
    const selectedValue = getSelectedValue(rootValue, refId, selectedKey);
    const matched = options.find(option => option.key === selectedValue);
    return (
      <React.Fragment>
        {
          !matched && <Alert message={`Choose ${selectedKey} to edit more config.`} type="info" />
        }
        {
          matched && (
            <Item
              refId={refId}
              filter={node => {
                return matched.renderKeys.indexOf(node.keyName) !== -1
              }}
            />
          )
        }
      </React.Fragment>
    )
  }
}

function getSelectedValue(rootValue, refId, selectedKey) {
  const targetRefId = refId.remove().child(selectedKey);
  return rootValue.getIn(targetRefId.getPathArr());
}