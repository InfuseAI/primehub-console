import * as React from 'react';
import {Item} from 'canner-helpers';

export default class BuildImageRefetchHelper extends React.Component {
  componentDidMount() {
    const {routes, updateQuery} = this.props;
    // refetch the data
    updateQuery([routes[0]], {
      where: {
        id: routes[1]
      },
      first: 1
    })
  }

  render() {
    return (
      <Item />
    )
  }
}