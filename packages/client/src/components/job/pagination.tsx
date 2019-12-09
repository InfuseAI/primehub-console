import * as React from 'react';
import {Button} from 'antd';

type Props = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: Function;
  previousPage: Function;
}

export default class Pagination extends React.Component<Props> {
  render() {
    const {nextPage, previousPage, hasNextPage, hasPreviousPage} = this.props
    return(
      <div style={{textAlign: 'right', marginTop: 16}}>
        <Button icon="left" onClick={() => previousPage()} disabled={!hasPreviousPage} />
        <Button icon="right" onClick={() => nextPage()} disabled={!hasNextPage} style={{marginLeft: 8}} />
      </div>
    )
  }
}