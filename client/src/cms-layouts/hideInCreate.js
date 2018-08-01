import React from 'react';

export default class HideInCreate extends React.Component {
  render() {
    const {renderChildren, refId, routes, params} = this.props;
    if (params && params.op === 'create') {
      return null;
    }
    return <React.Fragment>
      {renderChildren({
        refId,
        routes
      })}
    </React.Fragment>;
  }
}